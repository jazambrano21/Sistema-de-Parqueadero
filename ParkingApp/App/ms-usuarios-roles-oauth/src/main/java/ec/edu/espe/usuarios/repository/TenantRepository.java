package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySlug(String slug);
    Optional<Tenant> findByNombre(String nombre);
    boolean existsBySlug(String slug);
}
