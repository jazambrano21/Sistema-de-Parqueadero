package ec.edu.espe.zonas.repository;

import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EspacioRepositorio extends JpaRepository<Espacio, UUID> {

    List<Espacio> findByZonaId(UUID zonaId);

    long countByZonaId(UUID zonaId);

    List<Espacio> findByZonaIdAndEstado(UUID zonaId, EstadoEspacio estado);

    List<Espacio> findByEstado(EstadoEspacio estado);

}

