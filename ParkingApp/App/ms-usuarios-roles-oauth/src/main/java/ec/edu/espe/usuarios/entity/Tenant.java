package ec.edu.espe.usuarios.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa un parqueadero/empresa cliente que usa el sistema.
 * Todos los datos del sistema están particionados por tenantId.
 */
@Entity
@Table(name = "tenants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Nombre comercial del parqueadero. Ej: "Parqueadero Central ESPE" */
    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    /** Slug único usado como identificador corto. Ej: "espe-central" */
    @Column(nullable = false, unique = true, length = 50)
    private String slug;

    @Column(length = 200)
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(updatable = false)
    private LocalDateTime creadoEn;

    @Column
    private LocalDateTime actualizadoEn;

    @PrePersist
    public void prePersist() {
        this.creadoEn = LocalDateTime.now();
        this.actualizadoEn = LocalDateTime.now();
        if (this.activo == null) this.activo = true;
    }

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}
