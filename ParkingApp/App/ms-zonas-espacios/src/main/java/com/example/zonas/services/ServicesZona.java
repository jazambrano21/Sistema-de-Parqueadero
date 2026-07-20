package com.example.zonas.services;

import com.example.zonas.cache.CacheService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.ZonaRepositorio;
import com.example.zonas.services.interfaz.ZonaService;
import com.example.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServicesZona implements ZonaService {

    private final MapperUtils mapper;
    private final ZonaRepositorio zonaRepositorio;
    private final CacheService cacheService;

    // ─────────────────────────────────────────────
    // GET ALL — cacheable 5 min
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "zonas", key = "'all'")
    public List<ZonaResponseDto> listarZonas() {
        log.info("listarZonas → CACHE MISS — consultando BD");
        return zonaRepositorio.findAll().stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());

        cacheService.set(cacheKey, zonas, 60);

        return zonas;
    }

    // ─────────────────────────────────────────────
    // BUSCAR por nombre — cacheable 5 min
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "zonas", key = "'buscar:' + #nombre")
    public List<ZonaResponseDto> buscarZonas(String nombre) {
        log.info("buscarZonas({}) → CACHE MISS", nombre);
        return zonaRepositorio.findByNombreContainingIgnoreCase(nombre).stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // CREATE — invalida lista de zonas
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @CacheEvict(value = "zonas", allEntries = true)
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {
        String nombreNormalizado = generarNombreZona(requestDto.getNombre());
        if (zonaRepositorio.existsByNombre(nombreNormalizado)) {
            throw new IllegalArgumentException("Ya existe una zona con el nombre: " + requestDto.getNombre());
        }

        Zona zona = mapper.toZonaEntity(requestDto);
        zona.setCodigo(generarCodigoZona(requestDto.getTipo()));
        zona.setNombre(nombreNormalizado);
        zona.setEstado(EstadoEspacio.DISPONIBLE);
        zona.setActivo(true);
        zona.setFechaCreacion(LocalDateTime.now());
        zona.setFechaActualizacion(LocalDateTime.now());

        Zona zonaGuardada = zonaRepositorio.save(zona);

        ZonaResponseDto response =
                mapper.toZonaResponseDto(zonaGuardada);

        cacheService.set(
                "zonas:id:" + zonaGuardada.getId(),
                response,
                300
        );

        cacheService.delete("zonas:all");

        return response;    
    }

    // ─────────────────────────────────────────────
    // UPDATE — invalida zona individual y lista
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "zona",  key = "#idZone"),
        @CacheEvict(value = "zonas", allEntries = true)
    })
    public ZonaResponseDto actualizarZona(UUID idZone, ZonaRequestDto requestDto) {
        Zona zona = zonaRepositorio.findById(idZone)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + idZone));

        if (!zona.getTipo().equals(requestDto.getTipo())) {
            zona.setCodigo(generarCodigoZona(requestDto.getTipo()));
        }

        BeanUtils.copyProperties(requestDto, zona, "id", "fechaCreacion", "activo", "estado", "codigo");
        zona.setFechaActualizacion(LocalDateTime.now());

        Zona zonaActualizada = zonaRepositorio.save(zona);

        ZonaResponseDto response =
                mapper.toZonaResponseDto(zonaActualizada);

        cacheService.set(
                "zonas:id:" + zonaActualizada.getId(),
                response,
                300
        );

        cacheService.delete("zonas:all");

        return response;
    }

    // ─────────────────────────────────────────────
    // DELETE — invalida zona individual y lista
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "zona",  key = "#id"),
        @CacheEvict(value = "zonas", allEntries = true)
    })
    public void eliminarZona(UUID id) {
        Zona zona = zonaRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + id));

        if (zona.getEspacios() != null && !zona.getEspacios().isEmpty()) {
            boolean tieneEspaciosNoDisponibles = zona.getEspacios().stream()
                    .anyMatch(e -> e.getEstado() != EstadoEspacio.DISPONIBLE);
            if (tieneEspaciosNoDisponibles) {
                throw new IllegalStateException(
                        "No se puede eliminar la zona porque hay espacios ocupados, reservados o en mantenimiento"
                );
            }
        }

        zonaRepositorio.delete(zona);

        cacheService.delete("zonas:id:" + id);
        cacheService.delete("zonas:all");
    }

    // ─────────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────────
    private String generarCodigoZona(TipoZona tipo) {
        String tipoPrefijo = tipo == TipoZona.GENERAL
                ? "GEN"
                : tipo.name().substring(0, Math.min(tipo.name().length(), 3));
        long cuenta = zonaRepositorio.countByTipo(tipo) + 1;
        return String.format("ZON-%s-%02d", tipoPrefijo, cuenta);
    }

    private String generarNombreZona(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la zona no puede estar vacío");
        }
        return nombre.trim().toUpperCase();
    }
}
