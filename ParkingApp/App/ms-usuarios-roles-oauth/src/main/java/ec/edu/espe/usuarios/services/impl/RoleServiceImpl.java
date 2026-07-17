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

    @Override
    public RoleResponse createRole(
            RoleCreateRequest request
    ) {
        Role role = Role.builder()
                .name(request.getName())
                .description(
                        request.getDescription()
                )
                .build();

        Role savedRole =
                roleRepository.save(role);

        RoleResponse response =
                mapToResponse(savedRole);

        cacheService.set(
                "roles:id:" + savedRole.getId(),
                response,
                300
        );

        cacheService.set(
                "roles:name:"
                        + savedRole
                                .getName()
                                .toLowerCase(),
                response,
                300
        );

        cacheService.delete(
                "roles:all"
        );

        log.info(
                "Rol {} creado y caché actualizada",
                savedRole.getId()
        );

        return response;
    }

    @Override
    public RoleResponse getRoleById(
            UUID id
    ) {
        String cacheKey =
                "roles:id:" + id;

        RoleResponse roleCache =
                cacheService.get(
                        cacheKey,
                        RoleResponse.class
                );

        if (roleCache != null) {
            log.info(
                    "getRoleById({}) -> CACHE HIT",
                    id
            );

            return roleCache;
        }

        log.info(
                "getRoleById({}) -> CACHE MISS - consultando base de datos",
                id
        );

        Role role =
                roleRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found with id: "
                                                + id
                                )
                        );

        RoleResponse response =
                mapToResponse(role);

        cacheService.set(
                cacheKey,
                response,
                300
        );

        cacheService.set(
                "roles:name:"
                        + role.getName()
                                .toLowerCase(),
                response,
                300
        );

        return response;
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        String cacheKey =
                "roles:all";

        List<RoleResponse> rolesCache =
                cacheService.get(
                        cacheKey,
                        new TypeReference<
                                List<RoleResponse>
                        >() {}
                );

        if (rolesCache != null) {
            log.info(
                    "getAllRoles -> CACHE HIT"
            );

            return rolesCache;
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

    @Override
    public void deleteRole(
            UUID id
    ) {
        Role role =
                roleRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found with id: "
                                                + id
                                )
                        );

        roleRepository.delete(role);

        cacheService.delete(
                "roles:id:" + id
        );

        cacheService.delete(
                "roles:name:"
                        + role.getName()
                                .toLowerCase()
        );

        cacheService.delete(
                "roles:all"
        );

        cacheService.delete(
                "usuarios:all"
        );

        log.info(
                "Rol {} eliminado y caché invalidada",
                id
        );
    }

    @Override
    public RoleResponse getRoleByName(
            String name
    ) {
        String nombreNormalizado =
                name.trim().toLowerCase();

        String cacheKey =
                "roles:name:"
                        + nombreNormalizado;

        RoleResponse roleCache =
                cacheService.get(
                        cacheKey,
                        RoleResponse.class
                );

        if (roleCache != null) {
            log.info(
                    "getRoleByName({}) -> CACHE HIT",
                    nombreNormalizado
            );

            return roleCache;
        }

        log.info(
                "getRoleByName({}) -> CACHE MISS - consultando base de datos",
                nombreNormalizado
        );

        Role role =
                roleRepository
                        .findByName(name)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found with name: "
                                                + name
                                )
                        );

        RoleResponse response =
                mapToResponse(role);

        cacheService.set(
                cacheKey,
                response,
                300
        );

        cacheService.set(
                "roles:id:" + role.getId(),
                response,
                300
        );

        return response;
    }

    private RoleResponse mapToResponse(
            Role role
    ) {
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