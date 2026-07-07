package ec.edu.espe.zonas.services.interfaz;

import ec.edu.espe.zonas.dto.request.ZonaRequestDto;
import ec.edu.espe.zonas.dto.response.ZonaResponseDto;

import java.util.List;
import java.util.UUID;

public interface ZonaService {

    List<ZonaResponseDto> listarZonas();

    ZonaResponseDto crearZona(ZonaRequestDto requestDto);

    ZonaResponseDto actualizarZona(UUID id, ZonaRequestDto requestDto);

    void eliminarZona(UUID id);

    List<ZonaResponseDto> buscarZonas(String nombre);
}
