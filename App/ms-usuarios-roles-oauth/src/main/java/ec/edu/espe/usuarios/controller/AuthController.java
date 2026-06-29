package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.LoginRequest;
import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.LoginResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.service.AuthService;
import ec.edu.espe.usuarios.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Operaciones de login, registro y logout de usuarios")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    /**
     * Registro de usuario administrador (público).
     * POST http://localhost:8082/api/auth/register
     * Solo para crear el primer usuario administrador del sistema.
     */
    @Operation(
            summary = "Registrar usuario administrador",
            description = "Crea un nuevo usuario con rol ADMIN. No requiere autenticación previa. Solo para inicializar el sistema."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserCreateRequest request) {
        UserResponse user = userService.createUser(request);
        // Asignar rol ADMIN automáticamente
        // Nota: Necesitas crear el rol ADMIN primero o modificar el servicio
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(user);
    }

    /**
     * Login de usuario.
     * POST http://localhost:8082/api/auth/login
     */
    @Operation(
            summary = "Iniciar sesión",
            description = "Autentica al usuario con sus credenciales y retorna un token JWT. No requiere autenticación previa."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login exitoso, retorna token JWT"),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Logout — revoca el token antes de que expire.
     * POST http://localhost:8082/api/auth/logout
     * Header: Authorization: Bearer <token>
     */
    @Operation(
            summary = "Cerrar sesión",
            description = "Revoca el token JWT activo antes de su expiración. Requiere token Bearer válido."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Logout exitoso, token revocado"),
            @ApiResponse(responseCode = "401", description = "Token inválido o no proporcionado")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(authService.logout(authHeader));
    }
}
