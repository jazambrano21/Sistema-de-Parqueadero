package ec.edu.espe.zonas.repository;

import ec.edu.espe.zonas.entidades.TipoZona;
import ec.edu.espe.zonas.entidades.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ZonaRepositorio extends JpaRepository<Zona, UUID> {

    boolean existsByNombre(String nombre);

    long countByTipo(TipoZona tipo);

    java.util.List<Zona> findByNombreContainingIgnoreCase(String nombre);
}
