package ec.edu.espe.usuarios.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import ec.edu.espe.usuarios.cache.CacheService;
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
    private final CacheService cacheService;

    @Override
    public UserResponse createUser(
            UserCreateRequest userRequest
    ) {
        if (personRepository.existsByEmail(
                userRequest.getEmail()
        )) {
            throw new IllegalArgumentException(
                    "El correo ya esta registrado"
            );
        }

        if (personRepository.existsByDni(
                userRequest.getDni()
        )) {
            throw new IllegalArgumentException(
                    "El DNI ya esta registrado"
            );
        }

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
                .username(
                        generateUsername(
                                userRequest.getFirstName(),
                                userRequest.getMiddleName(),
                                userRequest.getLastName()
                        )
                )
                .passwordHash(userRequest.getDni())
                .build();

        user = userRepository.save(user);

        UserResponse response =
                mapToUserResponse(user);

        cacheService.set(
                "usuarios:id:" + user.getId(),
                response,
                300
        );

        cacheService.set(
                "personas:dni:" + person.getDni(),
                mapToPersonResponse(person),
                300
        );

        cacheService.delete(
                "usuarios:all"
        );

        log.info(
                "Usuario {} creado y caché actualizada",
                user.getId()
        );

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        String cacheKey =
                "usuarios:all";

        List<UserResponse> usuariosCache =
                cacheService.get(
                        cacheKey,
                        new TypeReference<
                                List<UserResponse>
                        >() {}
                );

        if (usuariosCache != null) {
            log.info(
                    "getUsers -> CACHE HIT"
            );

            return usuariosCache;
        }

        log.info(
                "getUsers -> CACHE MISS - consultando base de datos"
        );

        List<UserResponse> usuarios =
                userRepository
                        .findAllWithPerson()
                        .stream()
                        .map(this::mapToUserResponse)
                        .collect(Collectors.toList());

        cacheService.set(
                cacheKey,
                usuarios,
                60
        );

        return usuarios;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(
            UUID id
    ) {
        String cacheKey =
                "usuarios:id:" + id;

        UserResponse usuarioCache =
                cacheService.get(
                        cacheKey,
                        UserResponse.class
                );

        if (usuarioCache != null) {
            log.info(
                    "getUserById({}) -> CACHE HIT",
                    id
            );

            return usuarioCache;
        }

        log.info(
                "getUserById({}) -> CACHE MISS - consultando base de datos",
                id
        );

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Usuario no encontrado con id: "
                                                + id
                                )
                        );

        UserResponse response =
                mapToUserResponse(user);

        cacheService.set(
                cacheKey,
                response,
                300
        );

        if (user.getPerson() != null) {
            cacheService.set(
                    "personas:dni:"
                            + user.getPerson().getDni(),
                    mapToPersonResponse(
                            user.getPerson()
                    ),
                    300
            );
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PersonResponse getPersonByDni(
            String dni
    ) {
        String dniNormalizado =
                dni.trim();

        String cacheKey =
                "personas:dni:"
                        + dniNormalizado;

        PersonResponse personaCache =
                cacheService.get(
                        cacheKey,
                        PersonResponse.class
                );

        if (personaCache != null) {
            log.info(
                    "getPersonByDni({}) -> CACHE HIT",
                    dniNormalizado
            );

            return personaCache;
        }

        log.info(
                "getPersonByDni({}) -> CACHE MISS - consultando base de datos",
                dniNormalizado
        );

        Person person =
                personRepository
                        .findByDni(
                                dniNormalizado
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Persona no encontrada con DNI: "
                                                + dniNormalizado
                                )
                        );

        PersonResponse response =
                mapToPersonResponse(person);

        cacheService.set(
                cacheKey,
                response,
                300
        );

        return response;
    }

    @Override
    @Transactional
    public UserResponse assigneRole(
            UUID userId,
            UUID roleId
    ) {
        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Usuario no encontrado"
                                )
                        );

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Rol no encontrado"
                                )
                        );

        if (userRoleRepository
                .existsByUserIdAndRoleId(
                        userId,
                        roleId
                )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El rol ya esta asignado al usuario"
            );
        }

        UserRoleId userRoleId =
                new UserRoleId(
                        userId,
                        roleId
                );

        UserRole userRole =
                UserRole.builder()
                        .id(userRoleId)
                        .user(user)
                        .role(role)
                        .build();

        userRoleRepository.save(userRole);

        User userActualizado =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Usuario no encontrado"
                                )
                        );

        UserResponse response =
                mapToUserResponse(
                        userActualizado
                );

        cacheService.delete(
                "usuarios:id:" + userId
        );

        cacheService.delete(
                "usuarios:all"
        );

        cacheService.set(
                "usuarios:id:" + userId,
                response,
                300
        );

        log.info(
                "Rol {} asignado al usuario {} y caché invalidada",
                roleId,
                userId
        );

        return response;
    }

    private String generateUsername(
            String firstName,
            String middleName,
            String lastName
    ) {
        StringBuilder base =
                new StringBuilder();

        if (
                firstName != null
                && !firstName.isBlank()
        ) {
            base.append(
                    firstName
                            .substring(0, 1)
                            .toLowerCase()
            );
        }

        if (
                middleName != null
                && !middleName.isBlank()
        ) {
            base.append(
                    middleName
                            .substring(0, 1)
                            .toLowerCase()
            );
        }

        if (
                lastName != null
                && !lastName.isBlank()
        ) {
            base.append(
                    lastName.toLowerCase()
            );
        }

        String baseUsername =
                base.toString();

        String username =
                baseUsername;

        int counter = 1;

        while (
                userRepository
                        .existsByUsername(
                                username
                        )
        ) {
            username =
                    baseUsername + counter;

            counter++;
        }

        return username;
    }

    private UserResponse mapToUserResponse(
            User user
    ) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .person(
                        mapToPersonResponse(
                                user.getPerson()
                        )
                )
                .build();
    }

    private PersonResponse mapToPersonResponse(
            Person person
    ) {
        if (person == null) {
            return null;
        }

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