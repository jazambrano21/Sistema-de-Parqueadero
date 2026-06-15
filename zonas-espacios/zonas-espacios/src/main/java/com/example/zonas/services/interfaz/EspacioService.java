package com.example.zonas.services.interfaz;

import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EspacioService {

    List<EspacioResponseDto> obtenerEspacios();

    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto);

    EspacioResponseDto actualizarEspacio(UUID id, EspacioRequestDto requestDto);

    void eliminarEspacio(UUID id);

    EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado);

    List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado);

    List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona);

    List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado);

}
