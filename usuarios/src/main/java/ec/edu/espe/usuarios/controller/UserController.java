package ec.edu.espe.usuarios.controller;


import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }

    @GetMapping("/dni/{dni}")
    public ResponseEntity<PersonResponse> getPersonByDni(@PathVariable String dni) {
        return ResponseEntity.ok(userService.getPersonByDni(dni));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request){
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //formato uuid: 8-4-4-4-12
    //localhost:8080/api/users/{userId}/roles/{roleId}
    //localhost:8080/api/users/123e4567-e89b-12d3-a456-426614174000/roles/
    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserResponse> assigneRoleUser(@PathVariable UUID userId, @PathVariable UUID roleId) {
        return  ResponseEntity.ok(userService.assigneRole(userId, roleId));
    }
}
