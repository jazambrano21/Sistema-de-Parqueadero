package com.example.zonas.services;

import com.example.zonas.cache.CacheService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.Espacio;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.EspacioRepositorio;
import com.example.zonas.repository.ZonaRepositorio;
import com.example.zonas.services.interfaz.EspacioService;
import com.example.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class ServicesEspacio implements EspacioService {

    private final MapperUtils mapper;
    private final EspacioRepositorio espacioRepositorio;
    private final ZonaRepositorio zonaRepositorio;
    private final EspacioSseService espacioSseService;
    private final CacheService cacheService;

    // ─────────────────────────────────────────────
    // GET ALL — cacheable 30s (lista grande)
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espacios", key = "'all'")
    public List<EspacioResponseDto> obtenerEspacios() {
        log.info("obtenerEspacios → CACHE MISS — consultando BD");
        return espacioRepositorio.findAll().stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ONE por ID — cacheable 30s
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espacio", key = "#id")
    public EspacioResponseDto obtenerEspacioPorId(UUID id) {
        log.info("obtenerEspacioPorId({}) → CACHE MISS — consultando BD", id);
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        return mapper.toEspacioResponseDto(espacio);
    }

    // ─────────────────────────────────────────────
    // GET por estado — cacheable 30s
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espacios", key = "'estado:' + #estado")
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado) {
        log.info("obtenerEspaciosPorEstado({}) → CACHE MISS", estado);
        EstadoEspacio estadoEnum = parseEstado(estado);
        return espacioRepositorio.findByEstado(estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET por zona — cacheable 30s
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espaciosZona", key = "#idZona")
    public List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona) {
        log.info("obtenerEspaciosPorZona({}) → CACHE MISS", idZona);
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));
        return espacioRepositorio.findByZonaId(zona.getId()).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET por zona + estado — cacheable 30s
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espaciosZona", key = "#idZona + ':' + #estado")
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado) {
        log.info("obtenerEspaciosPorZonaEstado({},{}) → CACHE MISS", idZona, estado);
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));
        EstadoEspacio estadoEnum = parseEstado(estado);
        return espacioRepositorio.findByZonaIdAndEstado(zona.getId(), estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET disponibles por nombre de zona — TTL 20s (muy dinámico, ms-tickets lo consulta)
    // ─────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "espaciosDisp", key = "#nombreZona")
    public List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona) {
        log.info("obtenerEspaciosDisponiblesPorNombreZona({}) → CACHE MISS", nombreZona);
        List<Zona> zonas = zonaRepositorio.findByNombreContainingIgnoreCase(nombreZona);
        return zonas.stream()
                .flatMap(zona -> espacioRepositorio
                        .findByZonaIdAndEstado(zona.getId(), EstadoEspacio.DISPONIBLE).stream())
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // CREATE — invalida caches de listas
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "espacios",     allEntries = true),
        @CacheEvict(value = "espaciosZona", allEntries = true),
        @CacheEvict(value = "espaciosDisp", allEntries = true)
    })
    public EspacioResponseDto crearEspacio(EspacioRequestDto requestDto) {
        Zona zona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));

        long espaciosExistentes = espacioRepositorio.countByZonaId(zona.getId());
        if (espaciosExistentes >= zona.getCapacidad()) {
            throw new IllegalStateException(
                    "No se pueden crear más espacios. Capacidad máxima de la zona alcanzada: " + zona.getCapacidad()
            );
        }

        Espacio espacio = mapper.toEspacioEntity(requestDto);
        espacio.setZona(zona);
        espacio.setCodigo(zona.getCodigo());
        espacio.setNombre(generarNombreEspacio(zona));
        espacio.setEstado(EstadoEspacio.DISPONIBLE);
        espacio.setActivo(true);
        espacio.setFechaCreacion(LocalDateTime.now());
        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioGuardado =
        espacioRepositorio.save(espacio);

        EspacioResponseDto response =
                mapper.toEspacioResponseDto(
                        espacioGuardado
                );

        cacheService.set(
                "espacios:id:" + espacioGuardado.getId(),
                response,
                60
        );

        cacheService.delete("espacios:all");

        cacheService.delete(
                "espacios:zona:" + zona.getId()
        );

        cacheService.delete(
                "espacios:estado:"
                        + EstadoEspacio.DISPONIBLE.name()
        );

        return response;
    }

    // ─────────────────────────────────────────────
    // UPDATE — invalida caché del espacio y listas
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "espacio",      key = "#id"),
        @CacheEvict(value = "espacios",     allEntries = true),
        @CacheEvict(value = "espaciosZona", allEntries = true),
        @CacheEvict(value = "espaciosDisp", allEntries = true)
    })
    public EspacioResponseDto actualizarEspacio(UUID id, EspacioRequestDto requestDto) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));

        Zona nuevaZona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));

        espacio.setDescripcion(requestDto.getDescripcion());
        espacio.setTipo(requestDto.getTipo());

        if (!nuevaZona.getId().equals(espacio.getZona().getId())) {
            long espaciosExistentes = espacioRepositorio.countByZonaId(nuevaZona.getId());
            if (espaciosExistentes >= nuevaZona.getCapacidad()) {
                throw new IllegalStateException(
                        "No se pueden mover espacios. Capacidad máxima alcanzada: " + nuevaZona.getCapacidad()
                );
            }
            espacio.setZona(nuevaZona);
            espacio.setCodigo(nuevaZona.getCodigo());
            espacio.setNombre(generarNombreEspacio(nuevaZona));
        }

        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioActualizado =
        espacioRepositorio.save(espacio);

        EspacioResponseDto response =
                mapper.toEspacioResponseDto(
                        espacioActualizado
                );

        cacheService.set(
                "espacios:id:"
                        + espacioActualizado.getId(),
                response,
                60
        );

        cacheService.delete("espacios:all");

        cacheService.delete(
                "espacios:zona:"
                        + espacioActualizado
                                .getZona()
                                .getId()
        );

        return response;
    }

    // ─────────────────────────────────────────────
    // DELETE — invalida caches
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "espacio",      key = "#id"),
        @CacheEvict(value = "espacios",     allEntries = true),
        @CacheEvict(value = "espaciosZona", allEntries = true),
        @CacheEvict(value = "espaciosDisp", allEntries = true)
    })
    public void eliminarEspacio(UUID id) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        espacio.setActivo(false);
        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioActualizado =
                espacioRepositorio.save(espacio);

        cacheService.delete(
                "espacios:id:"
                        + espacioActualizado.getId()
        );

        cacheService.delete("espacios:all");

        cacheService.delete(
                "espacios:zona:"
                        + espacioActualizado
                                .getZona()
                                .getId()
        );    
    }

    // ─────────────────────────────────────────────
    // CAMBIAR ESTADO — invalida caches de espacios disponibles
    // ─────────────────────────────────────────────
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "espacio",      key = "#id"),
        @CacheEvict(value = "espacios",     allEntries = true),
        @CacheEvict(value = "espaciosZona", allEntries = true),
        @CacheEvict(value = "espaciosDisp", allEntries = true)
    })
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));

        espacio.setEstado(estado);
        espacio.setActivo(estado != EstadoEspacio.MANTENIMIENTO);
        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioActualizado =
        espacioRepositorio.save(espacio);

        EspacioResponseDto response =
                mapper.toEspacioResponseDto(
                        espacioActualizado
                );

        cacheService.set(
                "espacios:id:"
                        + espacioActualizado.getId(),
                response,
                60
        );

        cacheService.delete("espacios:all");

        cacheService.delete(
                "espacios:zona:"
                        + espacioActualizado
                                .getZona()
                                .getId()
        );

        cacheService.delete(
                "espacios:estado:"
                        + estado.name()
        );

        espacioSseService.emitirCambioEstado(response);

        return response;
    }

    // ─────────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────────
    private String generarNombreEspacio(Zona zona) {
        long numero = espacioRepositorio.countByZonaId(zona.getId()) + 1;
        return String.format("%s-%03d", zona.getCodigo(), numero);
    }

    private EstadoEspacio parseEstado(String estado) {
        try {
            return EstadoEspacio.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Estado inválido: " + estado + ". Válidos: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO"
            );
        }
    }
}
