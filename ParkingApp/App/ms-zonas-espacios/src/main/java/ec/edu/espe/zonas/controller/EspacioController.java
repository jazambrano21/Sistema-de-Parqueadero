package ec.edu.espe.zonas.controller;

import ec.edu.espe.zonas.dto.request.EspacioRequestDto;
import ec.edu.espe.zonas.dto.response.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.services.interfaz.EspacioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/espacios")
@RequiredArgsConstructor
public class EspacioController {

    private final EspacioService espacioService;

    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioService.obtenerEspacios());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<EspacioResponseDto>> obtenerDisponiblesPorZona(@RequestParam String zona) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosDisponiblesPorNombreZona(zona));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorEstado(estado));
    }

    @GetMapping("/zona/{idZona}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorZona(@PathVariable UUID idZona) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorZona(idZona));
    }

    @GetMapping("/zona/{idZona}/estado/{estado}")
    public ResponseEntity<List<EspacioResponseDto>> obtenerPorZonaYEstado(@PathVariable UUID idZona,
                                                                        @PathVariable String estado) {
        return ResponseEntity.ok(espacioService.obtenerEspaciosPorZonaEstado(idZona, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EspacioResponseDto> obtenerEspacioPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(espacioService.obtenerEspacioPorId(id));
    }

    @PostMapping
    public ResponseEntity<EspacioResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(espacioService.crearEspacio(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EspacioResponseDto> actualizarEspacio(@PathVariable UUID id,
                                                               @Valid @RequestBody EspacioRequestDto requestDto) {
        return ResponseEntity.ok(espacioService.actualizarEspacio(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEspacio(@PathVariable UUID id) {
        espacioService.eliminarEspacio(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<EspacioResponseDto> cambiarEstado(@PathVariable UUID id,
                                                            @RequestParam EstadoEspacio estado) {
        return ResponseEntity.ok(espacioService.cambiarEstado(id, estado));
    }
}
