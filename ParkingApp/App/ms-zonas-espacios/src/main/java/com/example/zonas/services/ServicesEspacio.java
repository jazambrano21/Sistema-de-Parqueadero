package com.example.zonas.services;

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

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspacios() {
        return espacioRepositorio.findAll().stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
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

        return mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
    }

    @Override
    @Transactional
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
                        "No se pueden mover espacios. Capacidad máxima de la zona alcanzada: " + nuevaZona.getCapacidad()
                );
            }

            espacio.setZona(nuevaZona);
            espacio.setCodigo(nuevaZona.getCodigo());
            espacio.setNombre(generarNombreEspacio(nuevaZona));
        }

        espacio.setFechaActualizacion(LocalDateTime.now());
        return mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
    }

    @Override
    @Transactional
    public void eliminarEspacio(UUID id) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));

        espacio.setActivo(false);
        espacio.setFechaActualizacion(LocalDateTime.now());
        espacioRepositorio.save(espacio);
    }

    @Override
    @Transactional
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));

        espacio.setEstado(estado);
        espacio.setActivo(estado != EstadoEspacio.MANTENIMIENTO);
        espacio.setFechaActualizacion(LocalDateTime.now());

        EspacioResponseDto response = mapper.toEspacioResponseDto(espacioRepositorio.save(espacio));
        espacioSseService.emitirCambioEstado(response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado) {
        EstadoEspacio estadoEnum = parseEstado(estado);
        return espacioRepositorio.findByEstado(estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona) {
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));

        return espacioRepositorio.findByZonaId(zona.getId()).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado) {
        Zona zona = zonaRepositorio.findById(idZona)
                .orElseThrow(() -> new IllegalArgumentException("Zona no encontrada: " + idZona));

        EstadoEspacio estadoEnum = parseEstado(estado);
        return espacioRepositorio.findByZonaIdAndEstado(zona.getId(), estadoEnum).stream()
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    private String generarNombreEspacio(Zona zona) {
        long numero = espacioRepositorio.countByZonaId(zona.getId()) + 1;
        return String.format("%s-%03d", zona.getCodigo(), numero);
    }

    @Override
    @Transactional(readOnly = true)
    public EspacioResponseDto obtenerEspacioPorId(UUID id) {
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Espacio no encontrado: " + id));
        return mapper.toEspacioResponseDto(espacio);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona) {
        List<Zona> zonas = zonaRepositorio.findByNombreContainingIgnoreCase(nombreZona);
        return zonas.stream()
                .flatMap(zona -> espacioRepositorio.findByZonaIdAndEstado(zona.getId(), EstadoEspacio.DISPONIBLE).stream())
                .map(mapper::toEspacioResponseDto)
                .collect(Collectors.toList());
    }

    private EstadoEspacio parseEstado(String estado) {
        try {
            return EstadoEspacio.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Estado inválido: " + estado + ". Validos: DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO");
        }
    }
}