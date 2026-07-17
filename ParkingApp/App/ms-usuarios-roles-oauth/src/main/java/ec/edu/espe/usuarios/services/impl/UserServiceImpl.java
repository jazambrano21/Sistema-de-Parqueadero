package ec.edu.espe.usuarios.services.impl;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.Person;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import ec.edu.espe.usuarios.repository.PersonRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import ec.edu.espe.usuarios.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    // ─────────────────────────────────────────────
    // CREATE — invalida lista de usuarios
    // ─────────────────────────────────────────────
    @Override
    @CacheEvict(value = "usuarios", allEntries = true)
    public UserResponse createUser(UserCreateRequest userRequest) {
        if (personRepository.existsByEmail(userRequest.getEmail()))
            throw new IllegalArgumentException("El correo ya esta registrado");
        if (personRepository.existsByDni(userRequest.getDni()))
            throw new IllegalArgumentException("El DNI ya esta registrado");

        Person person = Person.builder()
                .dni(userRequest.getDni())
                .firstName(userRequest.getFirstName())
                .middleName(userRequest.getMiddleName())
                .lastName(userRequest.getLastName())
                .email(userRequest.getEmail())
                .phone(userRequest.getPhone())
                .address(userRequest.getAddress())
                .nationality(userRequest.getNationality())
                .build();

        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username(generateUsername(
                        userRequest.getFirstName(),
                        userRequest.getMiddleName(),
                        userRequest.getLastName()))
                .passwordHash(userRequest.getDni())
                .build();

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    // ─────────────────────────────────────────────
    // GET ALL — cacheable 5 min
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "usuarios", key = "'all'")
    public List<UserResponse> getUsers() {
        log.info("getUsers → CACHE MISS — consultando BD");
        return userRepository.findAllWithPerson().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ONE por ID — cacheable 5 min
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "usuario", key = "#id")
    public UserResponse getUserById(UUID id) {
        log.info("getUserById({}) → CACHE MISS", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado con id: " + id));
        return mapToUserResponse(user);
    }

    // ─────────────────────────────────────────────
    // GET persona por DNI — cacheable 5 min (ms-tickets lo consulta frecuentemente)
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "persona", key = "#dni")
    public PersonResponse getPersonByDni(String dni) {
        log.info("getPersonByDni({}) → CACHE MISS", dni);
        Person person = personRepository.findByDni(dni)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Persona no encontrada con DNI: " + dni));
        return mapToPersonResponse(person);
    }

    // ─────────────────────────────────────────────
    // ASSIGN ROLE — invalida usuario individual y lista
    // ─────────────────────────────────────────────
    @Override
    @Caching(evict = {
        @CacheEvict(value = "usuario",   key = "#userId"),
        @CacheEvict(value = "usuarios",  allEntries = true)
    })
    public UserResponse assigneRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El rol ya esta asignado al usuario");

        UserRoleId userRoleId = new UserRoleId(userId, roleId);
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);
        return mapToUserResponse(user);
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    private String generateUsername(String firstName, String middleName, String lastName) {
        StringBuilder base = new StringBuilder();
        if (firstName != null && !firstName.isBlank()) base.append(firstName.substring(0, 1).toLowerCase());
        if (middleName != null && !middleName.isBlank()) base.append(middleName.substring(0, 1).toLowerCase());
        if (lastName != null && !lastName.isBlank()) base.append(lastName.toLowerCase());

        String baseUsername = base.toString();
        String username = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }
        return username;
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .person(mapToPersonResponse(user.getPerson()))
                .build();
    }

    private PersonResponse mapToPersonResponse(Person person) {
        if (person == null) return null;
        return PersonResponse.builder()
                .id(person.getId())
                .dni(person.getDni())
                .firstName(person.getFirstName())
                .middleName(person.getMiddleName())
                .lastName(person.getLastName())
                .email(person.getEmail())
                .phone(person.getPhone())
                .address(person.getAddress())
                .nationality(person.getNationality())
                .build();
    }
}
