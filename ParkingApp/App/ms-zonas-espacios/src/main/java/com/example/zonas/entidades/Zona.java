package com.example.zonas.entidades;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat ;

import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name ="zonas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Zona {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(nullable = false, unique = true, length = 12)
    private String codigo;

    @Column(nullable = true)
    private String descripcion;

    @Column(nullable = false)
    private Integer capacidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoZona tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "espacio")
    private EstadoEspacio estado;

    @Column
    private boolean activo;

    @OneToMany(mappedBy = "zona",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<Espacio> espacios;

    @Column
    private LocalDateTime fechaCreacion;

    @Column
    private LocalDateTime fechaActualizacion;

    /**
     * ID del tenant (parqueadero) al que pertenece esta zona.
     * Permite que múltiples parqueaderos coexistan con datos aislados.
     * Nullable para compatibilidad con registros anteriores a la implementación multitenant.
     */
    @Column(name = "tenant_id")
    private String tenantId;
}

