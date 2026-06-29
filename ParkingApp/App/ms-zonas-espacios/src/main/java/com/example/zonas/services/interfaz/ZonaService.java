package com.example.zonas.services.interfaz;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaService {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto crearZona(ZonaRequestDto requestDto);

    ZonaResponseDto actualizarZona(UUID id, ZonaRequestDto requestDto);

    void eliminarZona(UUID id);

    List<ZonaResponseDto> buscarZonas(String nombre);
}