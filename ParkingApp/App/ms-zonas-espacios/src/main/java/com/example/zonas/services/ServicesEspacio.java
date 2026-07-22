package com.example.zonas.services;

import com.example.zonas.cache.CacheService;
import com.example.zonas.config.TenantContext;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicesEspacio implements EspacioService {

    private final MapperUtils mapper;
    private final EspacioRepositorio espacioRepositorio;
    private final ZonaRepositorio zonaRepositorio;
    private final EspacioSseService espacioSseService;
    private final CacheService cacheService;

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspacios() {
        String tenantId = TenantContext.getTenantId();
        String cacheKey = tenantId != null ? "espacios:all:" + tenantId : "espacios:all";

        List<EspacioResponseDto> espaciosCache =
                cacheService.get(cacheKey, new TypeReference<List<EspacioResponseDto>>() {});
        if (espaciosCache != null) return espaciosCache;

        List<EspacioResponseDto> espacios = (tenantId != null)
                ? espacioRepositorio.findByTenantId(tenantId).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList())
                : espacioRepositorio.findAll().stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList());

        cacheService.set(cacheKey, espacios, 30);
        return espacios;
    }

    @Override
    @Transactional
    public EspacioResponseDto crearEspacio(EspacioRequestDto requestDto) {
        String tenantId = TenantContext.getTenantId();

        Zona zona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));

        // Validar que la zona pertenezca al mismo tenant
        if (tenantId != null && zona.getTenantId() != null && !tenantId.equals(zona.getTenantId())) {
            throw new IllegalStateException("La zona no pertenece al tenant actual");
        }

        long espaciosExistentes = (tenantId != null)
                ? espacioRepositorio.countByZonaIdAndTenantId(zona.getId(), tenantId)
                : espacioRepositorio.countByZonaId(zona.getId());

        if (espaciosExistentes >= zona.getCapacidad()) {
            throw new IllegalStateException(
                    "No se pueden crear más espacios. Capacidad máxima de la zona alcanzada: " + zona.getCapacidad());
        }

        Espacio espacio = mapper.toEspacioEntity(requestDto);
        espacio.setZona(zona);
        espacio.setCodigo(zona.getCodigo());
        espacio.setNombre(generarNombreEspacio(zona, tenantId));
        espacio.setEstado(EstadoEspacio.DISPONIBLE);
        espacio.setActivo(true);
        espacio.setTenantId(tenantId);
        espacio.setFechaCreacion(LocalDateTime.now());
        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioGuardado = espacioRepositorio.save(espacio);
        EspacioResponseDto response = mapper.toEspacioResponseDto(espacioGuardado);

        cacheService.set("espacios:id:" + espacioGuardado.getId(), response, 60);
        invalidarCachesEspacio(zona.getId(), EstadoEspacio.DISPONIBLE, tenantId);

        return response;
    }

    @Override
    @Transactional
    public EspacioResponseDto actualizarEspacio(UUID id, EspacioRequestDto requestDto) {
        String tenantId = TenantContext.getTenantId();
        Espacio espacio = findEspacioByTenant(id, tenantId);

        Zona nuevaZona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + requestDto.getIdZona()));

        espacio.setDescripcion(requestDto.getDescripcion());
        espacio.setTipo(requestDto.getTipo());

        if (!nuevaZona.getId().equals(espacio.getZona().getId())) {
            long espaciosExistentes = (tenantId != null)
                    ? espacioRepositorio.countByZonaIdAndTenantId(nuevaZona.getId(), tenantId)
                    : espacioRepositorio.countByZonaId(nuevaZona.getId());

            if (espaciosExistentes >= nuevaZona.getCapacidad()) {
                throw new IllegalStateException(
                        "No se pueden mover espacios. Capacidad máxima de la zona alcanzada: " + nuevaZona.getCapacidad());
            }
            espacio.setZona(nuevaZona);
            espacio.setCodigo(nuevaZona.getCodigo());
            espacio.setNombre(generarNombreEspacio(nuevaZona, tenantId));
        }

        espacio.setFechaActualizacion(LocalDateTime.now());
        Espacio espacioActualizado = espacioRepositorio.save(espacio);
        EspacioResponseDto response = mapper.toEspacioResponseDto(espacioActualizado);

        cacheService.set("espacios:id:" + espacioActualizado.getId(), response, 60);
        invalidarCachesEspacio(espacioActualizado.getZona().getId(), null, tenantId);

        return response;
    }

    @Override
    @Transactional
    public void eliminarEspacio(UUID id) {
        String tenantId = TenantContext.getTenantId();
        Espacio espacio = findEspacioByTenant(id, tenantId);

        espacio.setActivo(false);
        espacio.setFechaActualizacion(LocalDateTime.now());
        Espacio espacioActualizado = espacioRepositorio.save(espacio);

        cacheService.delete("espacios:id:" + espacioActualizado.getId());
        invalidarCachesEspacio(espacioActualizado.getZona().getId(), null, tenantId);
    }

    @Override
    @Transactional
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado) {
        String tenantId = TenantContext.getTenantId();
        Espacio espacio = findEspacioByTenant(id, tenantId);

        espacio.setEstado(estado);
        espacio.setActivo(estado != EstadoEspacio.MANTENIMIENTO);
        espacio.setFechaActualizacion(LocalDateTime.now());

        Espacio espacioActualizado = espacioRepositorio.save(espacio);
        EspacioResponseDto response = mapper.toEspacioResponseDto(espacioActualizado);

        cacheService.set("espacios:id:" + espacioActualizado.getId(), response, 60);
        invalidarCachesEspacio(espacioActualizado.getZona().getId(), estado, tenantId);
        espacioSseService.emitirCambioEstado(response);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado) {
        EstadoEspacio estadoEnum = parseEstado(estado);
        String tenantId = TenantContext.getTenantId();
        String cacheKey = tenantId != null
                ? "espacios:estado:" + estadoEnum.name() + ":" + tenantId
                : "espacios:estado:" + estadoEnum.name();

        List<EspacioResponseDto> espaciosCache =
                cacheService.get(cacheKey, new TypeReference<List<EspacioResponseDto>>() {});
        if (espaciosCache != null) return espaciosCache;

        List<EspacioResponseDto> espacios = (tenantId != null)
                ? espacioRepositorio.findByEstadoAndTenantId(estadoEnum, tenantId).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList())
                : espacioRepositorio.findByEstado(estadoEnum).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList());

        cacheService.set(cacheKey, espacios, 30);
        return espacios;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona) {
        String tenantId = TenantContext.getTenantId();
        String cacheKey = tenantId != null
                ? "espacios:zona:" + idZona + ":" + tenantId
                : "espacios:zona:" + idZona;

        List<EspacioResponseDto> espaciosCache =
                cacheService.get(cacheKey, new TypeReference<List<EspacioResponseDto>>() {});
        if (espaciosCache != null) return espaciosCache;

        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));

        List<EspacioResponseDto> espacios = (tenantId != null)
                ? espacioRepositorio.findByZonaIdAndTenantId(zona.getId(), tenantId).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList())
                : espacioRepositorio.findByZonaId(zona.getId()).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList());

        cacheService.set(cacheKey, espacios, 30);
        return espacios;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado) {
        String tenantId = TenantContext.getTenantId();
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));

        EstadoEspacio estadoEnum = parseEstado(estado);

        return (tenantId != null)
                ? espacioRepositorio.findByZonaIdAndEstadoAndTenantId(zona.getId(), estadoEnum, tenantId).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList())
                : espacioRepositorio.findByZonaIdAndEstado(zona.getId(), estadoEnum).stream()
                        .map(mapper::toEspacioResponseDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EspacioResponseDto obtenerEspacioPorId(UUID id) {
        String tenantId = TenantContext.getTenantId();
        String cacheKey = "espacios:id:" + id;

        EspacioResponseDto espacioCache = cacheService.get(cacheKey, EspacioResponseDto.class);
        if (espacioCache != null) return espacioCache;

        Espacio espacio = findEspacioByTenant(id, tenantId);
        EspacioResponseDto response = mapper.toEspacioResponseDto(espacio);
        cacheService.set(cacheKey, response, 60);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona) {
        String tenantId = TenantContext.getTenantId();

        List<Zona> zonas = (tenantId != null)
                ? zonaRepositorio.findByNombreContainingIgnoreCaseAndTenantId(nombreZona, tenantId)
                : zonaRepositorio.findByNombreContainingIgnoreCase(nombreZona);

        return zonas.stream()
                .flatMap(zona -> {
                    List<Espacio> disponibles = (tenantId != null)
                            ? espacioRepositorio.findByZonaIdAndEstadoAndTenantId(
                                    zona.getId(), EstadoEspacio.DISPONIBLE, tenantId)
                            : espacioRepositorio.findByZonaIdAndEstado(
                                    zona.getId(), EstadoEspacio.DISPONIBLE);
                    return disponibles.stream();
                })
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Espacio findEspacioByTenant(UUID id, String tenantId) {
        if (tenantId != null) {
            return espacioRepositorio.findByIdAndTenantId(id, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Espacio no encontrado o no pertenece al tenant actual: " + id));
        }
        return espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
    }

    private String generarNombreEspacio(Zona zona, String tenantId) {
        long numero = (tenantId != null)
                ? espacioRepositorio.countByZonaIdAndTenantId(zona.getId(), tenantId) + 1
                : espacioRepositorio.countByZonaId(zona.getId()) + 1;
        return String.format("%s-%03d", zona.getCodigo(), numero);
    }

    private void invalidarCachesEspacio(UUID zonaId, EstadoEspacio estado, String tenantId) {
        String suffix = tenantId != null ? ":" + tenantId : "";
        cacheService.delete("espacios:all" + suffix);
        cacheService.delete("espacios:zona:" + zonaId + suffix);
        if (estado != null) {
            cacheService.delete("espacios:estado:" + estado.name() + suffix);
        }
    }

    private EstadoEspacio parseEstado(String estado) {
        try {
            return EstadoEspacio.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Estado inválido: " + estado + ". Válidos: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO");
        }
    }
}
