package ec.edu.espe.usuarios.repository;

import ec.edu.espe.usuarios.entity.UserRole;
import ec.edu.espe.usuarios.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    boolean existsByUserIdAndRoleId(UUID idUser, UUID idRole);

    // Permite preguntar "¿ya hay algún usuario con el rol X?" sin conocer el UUID del rol.
    // Se usa para decidir si el registro público debe crear un ADMIN (primera vez)
    // o un USER (ya existe al menos un admin).
    boolean existsByRole_NameIgnoreCase(String roleName);

    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.user.id = :userId")
    List<UserRole> findByUserId(UUID userId);
}