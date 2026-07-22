package com.example.zonas.repository;

import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EspacioRepositorio extends JpaRepository<Espacio, UUID> {

    // ── Consultas originales (sin tenant) ────────────────────────────────────
    List<Espacio> findByZonaId(UUID zonaId);
    long countByZonaId(UUID zonaId);
    List<Espacio> findByZonaIdAndEstado(UUID zonaId, EstadoEspacio estado);
    List<Espacio> findByEstado(EstadoEspacio estado);

    // ── Consultas filtradas por tenant ────────────────────────────────────────
    List<Espacio> findByTenantId(String tenantId);
    List<Espacio> findByZonaIdAndTenantId(UUID zonaId, String tenantId);
    List<Espacio> findByEstadoAndTenantId(EstadoEspacio estado, String tenantId);
    List<Espacio> findByZonaIdAndEstadoAndTenantId(UUID zonaId, EstadoEspacio estado, String tenantId);
    long countByZonaIdAndTenantId(UUID zonaId, String tenantId);
    Optional<Espacio> findByIdAndTenantId(UUID id, String tenantId);
}
