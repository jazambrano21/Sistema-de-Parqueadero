package ec.edu.espe.zonas.dto.response;


import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoZona;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ZonaResponseDto {
    //Calcular el total de espacios disponibles

    private UUID id;

    private String nombre;

    private String codigo;

    private String descripcion;

    private Integer capacidad;

    private TipoZona tipo;

    private EstadoEspacio estado;

    private boolean activo;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaActualizacion;

    private Integer espacios;

}
