package ec.edu.espe.usuarios.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import ec.edu.espe.usuarios.cache.CacheService;
import ec.edu.espe.usuarios.dto.request.RoleCreateRequest;
import ec.edu.espe.usuarios.dto.response.RoleResponse;
import ec.edu.espe.usuarios.entity.Role;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.services.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final CacheService cacheService;

    // ─────────────────────────────────────────────
    // CREATE — invalida lista
    // ─────────────────────────────────────────────
    @Override
    @CacheEvict(value = "roles", allEntries = true)
    public RoleResponse createRole(RoleCreateRequest request) {
        Role role = Role.builder()
                .name(request.getName())
                .description(
                        request.getDescription()
                )
                .build();
        return mapToResponse(roleRepository.save(role));
    }

    // ─────────────────────────────────────────────
    // GET ALL — cacheable 10 min (roles cambian poco)
    // ─────────────────────────────────────────────
    @Override
    @Cacheable(value = "roles", key = "'all'")
    public List<RoleResponse> getAllRoles() {
        log.info("getAllRoles → CACHE MISS — consultando BD");
        return roleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ONE por ID — cacheable 10 min
    // ─────────────────────────────────────────────
    @Override
    @Cacheable(value = "rol", key = "#id")
    public RoleResponse getRoleById(UUID id) {
        log.info("getRoleById({}) → CACHE MISS", id);
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return mapToResponse(role);
    }

    // ─────────────────────────────────────────────
    // GET por nombre — cacheable 10 min
    // ─────────────────────────────────────────────
    @Override
    @Cacheable(value = "rol", key = "'nombre:' + #name")
    public RoleResponse getRoleByName(String name) {
        log.info("getRoleByName({}) → CACHE MISS", name);
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Role not found with name: " + name));
        return mapToResponse(role);
    }

    // ─────────────────────────────────────────────
    // DELETE — invalida rol individual y lista
    // ─────────────────────────────────────────────
    @Override
    @Caching(evict = {
        @CacheEvict(value = "rol",   key = "#id"),
        @CacheEvict(value = "roles", allEntries = true)
    })
    public void deleteRole(UUID id) {
        if (!roleRepository.existsById(id)) {
            throw new RuntimeException("Role not found with id: " + id);
        }

        log.info(
                "getAllRoles -> CACHE MISS - consultando base de datos"
        );

        List<RoleResponse> roles =
                roleRepository
                        .findAll()
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());

        cacheService.set(
                cacheKey,
                roles,
                300
        );

        return roles;
    }

    private RoleResponse mapToResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(
                        role.getDescription()
                )
                .active(role.getActive())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}