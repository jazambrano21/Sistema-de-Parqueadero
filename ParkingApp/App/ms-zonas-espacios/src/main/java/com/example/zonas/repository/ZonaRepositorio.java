package com.example.zonas.repository;

import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ZonaRepositorio extends JpaRepository<Zona, UUID> {

    // ── Consultas originales (sin tenant) ────────────────────────────────────
    boolean existsByNombre(String nombre);
    long countByTipo(TipoZona tipo);
    List<Zona> findByNombreContainingIgnoreCase(String nombre);

    // ── Consultas filtradas por tenant ────────────────────────────────────────
    List<Zona> findByTenantId(String tenantId);
    List<Zona> findByNombreContainingIgnoreCaseAndTenantId(String nombre, String tenantId);
    boolean existsByNombreAndTenantId(String nombre, String tenantId);
    long countByTipoAndTenantId(TipoZona tipo, String tenantId);
}
