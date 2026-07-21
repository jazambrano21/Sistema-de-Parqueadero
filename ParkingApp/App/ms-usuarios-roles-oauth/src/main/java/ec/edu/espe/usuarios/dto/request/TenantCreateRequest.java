package ec.edu.espe.usuarios.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TenantCreateRequest {

    @NotBlank(message = "El nombre del tenant es requerido")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String nombre;

    /**
     * Slug único de URL amigable. Solo letras minúsculas, números y guiones.
     * Ej: "parqueadero-espe-central"
     */
    @NotBlank(message = "El slug es requerido")
    @Size(max = 50, message = "El slug no puede superar 50 caracteres")
    @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
             message = "El slug solo puede contener letras minúsculas, números y guiones (ej: mi-parqueadero)")
    private String slug;

    @Size(max = 200, message = "La descripción no puede superar 200 caracteres")
    private String descripcion;
}
