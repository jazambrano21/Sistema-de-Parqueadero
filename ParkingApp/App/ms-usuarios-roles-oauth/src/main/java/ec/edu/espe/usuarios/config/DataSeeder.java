package ec.edu.espe.usuarios.config;

import ec.edu.espe.usuarios.entity.Person;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import ec.edu.espe.usuarios.repository.PersonRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedAdminUser();
    }

    private void seedRoles() {
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Administrador del sistema con acceso total")
                    .build();
            roleRepository.save(adminRole);
            log.info("Rol ADMIN creado por defecto");
        }

        if (roleRepository.findByName("USER").isEmpty()) {
            Role userRole = Role.builder()
                    .name("USER")
                    .description("Usuario estandar del sistema")
                    .build();
            roleRepository.save(userRole);
            log.info("Rol USER creado por defecto");
        }
    }

    private void seedAdminUser() {
        if (userRepository.existsByUsername("admin")) {
            log.info("Usuario admin ya existe, se omite la creacion");
            return;
        }

        if (personRepository.existsByDni("1234567890")) {
            log.info("Persona con DNI 1234567890 ya existe, se omite la creacion del admin");
            return;
        }

        Person person = Person.builder()
                .dni("1234567890")
                .firstName("Admin")
                .lastName("System")
                .email("admin@parqueadero.com")
                .phone("0000000000")
                .nationality("Ecuatoriana")
                .build();
        person = personRepository.save(person);

        User user = User.builder()
                .id(person.getId())
                .person(person)
                .username("admin")
                .passwordHash("1234567890")
                .build();
        user = userRepository.save(user);

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol ADMIN no encontrado despues de crearlo"));

        UserRoleId userRoleId = new UserRoleId(user.getId(), adminRole.getId());
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(adminRole)
                .build();
        userRoleRepository.save(userRole);

        log.info("Usuario admin creado: username='admin', password='1234567890'");
    }
}
