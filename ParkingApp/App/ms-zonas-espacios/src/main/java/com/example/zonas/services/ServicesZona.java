package com.example.zonas.services;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.entidades.TipoZona;
import com.example.zonas.entidades.Zona;
import com.example.zonas.repository.ZonaRepositorio;
import com.example.zonas.services.interfaz.ZonaService;
import com.example.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicesZona implements ZonaService {

    private final MapperUtils mapper;
    private final ZonaRepositorio zonaRepositorio;

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> listarZonas() {
        return zonaRepositorio.findAll().stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {
        if (zonaRepositorio.existsByNombre(requestDto.getNombre())) {
            throw new IllegalArgumentException("Ya existe una zona con el nombre: " + requestDto.getNombre());
        }

        Zona zona = mapper.toZonaEntity(requestDto);
        zona.setCodigo(generarCodigoZona(requestDto.getTipo()));
        zona.setNombre(generarNombreZona(requestDto.getNombre()));
        zona.setEstado(EstadoEspacio.DISPONIBLE);
        zona.setActivo(true);
        zona.setFechaCreacion(LocalDateTime.now());
        zona.setFechaActualizacion(LocalDateTime.now());

        return mapper.toZonaResponseDto(zonaRepositorio.save(zona));
    }

    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZone, ZonaRequestDto requestDto) {
        Zona zona = zonaRepositorio.findById(idZone)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + idZone));

        if (!zona.getTipo().equals(requestDto.getTipo())) {
            zona.setCodigo(generarCodigoZona(requestDto.getTipo()));
        }

        BeanUtils.copyProperties(requestDto, zona, "id", "fechaCreacion", "activo", "estado", "codigo");
        zona.setFechaActualizacion(LocalDateTime.now());

        return mapper.toZonaResponseDto(zonaRepositorio.save(zona));
    }

    @Override
    @Transactional
    public void eliminarZona(UUID id) {
        Zona zona = zonaRepositorio.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe zona con id: " + id));

        if (zona.getEspacios() != null && !zona.getEspacios().isEmpty()) {
            boolean tieneEspaciosNoDisponibles = zona.getEspacios().stream()
                    .anyMatch(espacio -> espacio.getEstado() != EstadoEspacio.DISPONIBLE);
            if (tieneEspaciosNoDisponibles) {
                throw new IllegalStateException("No se puede eliminar la zona porque hay espacios ocupados, reservados o en mantenimiento");
            }
        }

        zonaRepositorio.delete(zona);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> buscarZonas(String nombre) {
        return zonaRepositorio.findByNombreContainingIgnoreCase(nombre).stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    private String generarCodigoZona(TipoZona tipo) {
        String tipoPrefijo = tipo == TipoZona.GENERAL ? "GEN" : tipo.name().substring(0, Math.min(tipo.name().length(), 3));
        long cuenta = zonaRepositorio.countByTipo(tipo) + 1;
        return String.format("ZON-%s-%02d", tipoPrefijo, cuenta);
    }

    private String generarNombreZona(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la zona no puede estar vacío");
        }
        String nombreNormalizado = nombre.trim().toUpperCase();
        return nombreNormalizado.length() >= 3 
            ? nombreNormalizado.substring(0, 3) 
            : nombreNormalizado;
    }
}
