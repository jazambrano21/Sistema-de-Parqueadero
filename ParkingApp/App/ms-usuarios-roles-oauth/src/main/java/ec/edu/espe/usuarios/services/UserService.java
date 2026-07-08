package ec.edu.espe.usuarios.services;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse createUser(UserCreateRequest userRequest);
    List<UserResponse> getUsers();
    UserResponse getUserById(UUID id);
    PersonResponse getPersonByDni(String dni);
    UserResponse assigneRole(UUID userId, UUID roleId);

    /**
     * Asigna un rol al usuario buscándolo por nombre (ej. "ADMIN", "USER").
     * Si el rol no existe todavía en la tabla `role`, lo crea automáticamente.
     */
    UserResponse assignRoleByName(UUID userId, String roleName);

    /**
     * Asigna el rol inicial al registrarse: ADMIN si todavía no existe
     * ningún usuario con ese rol (primer arranque del sistema), USER en
     * cualquier otro caso.
     */
    UserResponse assignInitialRole(UUID userId);
}

