package ec.edu.espe.usuarios.service;

import ec.edu.espe.usuarios.dto.request.TenantCreateRequest;
import ec.edu.espe.usuarios.dto.response.TenantResponse;
import ec.edu.espe.usuarios.entity.Tenant;
import ec.edu.espe.usuarios.entity.User;
import ec.edu.espe.usuarios.repository.TenantRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
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
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    // ─── CRUD Tenants ────────────────────────────────────────────────────────

    @Transactional
    public TenantResponse crear(TenantCreateRequest request) {
        if (tenantRepository.existsBySlug(request.getSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un tenant con el slug: " + request.getSlug());
        }
        Tenant tenant = Tenant.builder()
                .nombre(request.getNombre())
                .slug(request.getSlug())
                .descripcion(request.getDescripcion())
                .activo(true)
                .build();
        Tenant guardado = tenantRepository.save(tenant);
        log.info("Tenant creado: {} ({})", guardado.getNombre(), guardado.getId());
        return toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<TenantResponse> listarTodos() {
        return tenantRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TenantResponse buscarPorId(UUID id) {
        return toResponse(getTenantOrThrow(id));
    }

    @Transactional(readOnly = true)
    public TenantResponse buscarPorSlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tenant no encontrado con slug: " + slug));
        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse actualizar(UUID id, TenantCreateRequest request) {
        Tenant tenant = getTenantOrThrow(id);

        // Validar que el nuevo slug no lo tenga otro tenant
        if (!tenant.getSlug().equals(request.getSlug())
                && tenantRepository.existsBySlug(request.getSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un tenant con el slug: " + request.getSlug());
        }

        tenant.setNombre(request.getNombre());
        tenant.setSlug(request.getSlug());
        tenant.setDescripcion(request.getDescripcion());
        return toResponse(tenantRepository.save(tenant));
    }

    @Transactional
    public void desactivar(UUID id) {
        Tenant tenant = getTenantOrThrow(id);
        tenant.setActivo(false);
        tenantRepository.save(tenant);
        log.info("Tenant desactivado: {}", id);
    }

    // ─── Asignación de usuarios a tenants ────────────────────────────────────

    /**
     * Asigna un usuario existente a un tenant.
     * Solo SUPERADMIN puede hacer esto.
     */
    @Transactional
    public void asignarUsuario(UUID tenantId, UUID usuarioId) {
        Tenant tenant = getTenantOrThrow(tenantId);
        User user = userRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuario no encontrado: " + usuarioId));
        user.setTenant(tenant);
        userRepository.save(user);
        log.info("Usuario {} asignado al tenant {}", usuarioId, tenantId);
    }

    /**
     * Desvincula un usuario de su tenant actual.
     */
    @Transactional
    public void desasignarUsuario(UUID usuarioId) {
        User user = userRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuario no encontrado: " + usuarioId));
        user.setTenant(null);
        userRepository.save(user);
        log.info("Usuario {} desvinculado de su tenant", usuarioId);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private Tenant getTenantOrThrow(UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tenant no encontrado: " + id));
    }

    private TenantResponse toResponse(Tenant t) {
        return TenantResponse.builder()
                .id(t.getId())
                .nombre(t.getNombre())
                .slug(t.getSlug())
                .descripcion(t.getDescripcion())
                .activo(t.getActivo())
                .creadoEn(t.getCreadoEn())
                .actualizadoEn(t.getActualizadoEn())
                .build();
    }
}
