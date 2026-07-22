package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.TenantCreateRequest;
import ec.edu.espe.usuarios.dto.response.TenantResponse;
import ec.edu.espe.usuarios.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * CRUD de tenants (parqueaderos/empresas cliente).
 * Todas las operaciones requieren rol ADMIN (SUPERADMIN del sistema).
 */
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "Gestión de parqueaderos/empresas cliente (multitenancy)")
@SecurityRequirement(name = "bearerAuth")
public class TenantController {

    private final TenantService tenantService;

    @Operation(summary = "Crear un nuevo tenant (parqueadero)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<TenantResponse> crear(@Valid @RequestBody TenantCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantService.crear(request));
    }

    @Operation(summary = "Listar todos los tenants")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<TenantResponse>> listar() {
        return ResponseEntity.ok(tenantService.listarTodos());
    }

    @Operation(summary = "Obtener tenant por ID")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<TenantResponse> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.buscarPorId(id));
    }

    @Operation(summary = "Obtener tenant por slug")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/slug/{slug}")
    public ResponseEntity<TenantResponse> obtenerPorSlug(@PathVariable String slug) {
        return ResponseEntity.ok(tenantService.buscarPorSlug(slug));
    }

    @Operation(summary = "Actualizar datos de un tenant")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<TenantResponse> actualizar(
            @PathVariable UUID id,
            @Valid @RequestBody TenantCreateRequest request) {
        return ResponseEntity.ok(tenantService.actualizar(id, request));
    }

    @Operation(summary = "Desactivar un tenant")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable UUID id) {
        tenantService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Asignar usuario a tenant")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{tenantId}/usuarios/{usuarioId}")
    public ResponseEntity<Void> asignarUsuario(
            @PathVariable UUID tenantId,
            @PathVariable UUID usuarioId) {
        tenantService.asignarUsuario(tenantId, usuarioId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Desvincular usuario de su tenant")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/usuarios/{usuarioId}")
    public ResponseEntity<Void> desasignarUsuario(@PathVariable UUID usuarioId) {
        tenantService.desasignarUsuario(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
