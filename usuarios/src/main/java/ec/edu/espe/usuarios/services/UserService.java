package ec.edu.espe.usuarios.services;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.User;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse createUser(UserCreateRequest userRequest);

    List<UserResponse> getUsers();

    UserResponse getUserById(UUID id);

    UserResponse assigneRole(UUID userId, UUID roleId);
}
