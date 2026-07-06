package ec.edu.espe.zonas.services.interfaz;

import ec.edu.espe.zonas.dto.request.EspacioRequestDto;
import ec.edu.espe.zonas.dto.response.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

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

    EspacioResponseDto obtenerEspacioPorId(UUID id);

    List<EspacioResponseDto> obtenerEspaciosDisponiblesPorNombreZona(String nombreZona);

}
