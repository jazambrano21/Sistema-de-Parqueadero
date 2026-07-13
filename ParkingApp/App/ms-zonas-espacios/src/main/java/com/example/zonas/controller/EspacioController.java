package com.example.zonas.controller;

import com.example.zonas.audit.AuditEventPublisher;
import com.example.zonas.dto.request.EspacioRequestDto;
import com.example.zonas.dto.response.EspacioResponseDto;
import com.example.zonas.entidades.EstadoEspacio;
import com.example.zonas.services.EspacioSseService;
import com.example.zonas.services.interfaz.EspacioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/espacios")
@RequiredArgsConstructor
public class EspacioController {

    private final EspacioService espacioService;
    private final AuditEventPublisher auditEventPublisher;
    private final EspacioSseService espacioSseService;

    @GetMapping
    public ResponseEntity<List<EspacioResponseDto>> listarEspacios() {
        return ResponseEntity.ok(espacioService.obtenerEspacios());
    }

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter suscribirseASse() {
        return espacioSseService.subscribe();
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
    public ResponseEntity<EspacioResponseDto> crearEspacio(@Valid @RequestBody EspacioRequestDto requestDto,
                                                            HttpServletRequest request) {
        EspacioResponseDto response = espacioService.crearEspacio(requestDto);
        auditEventPublisher.publish(request, "ESPACIO", "CREATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "zonaId", response.getIdZona()
        ), "audit.espacio.create");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EspacioResponseDto> actualizarEspacio(@PathVariable UUID id,
                                                               @Valid @RequestBody EspacioRequestDto requestDto,
                                                               HttpServletRequest request) {
        EspacioResponseDto response = espacioService.actualizarEspacio(id, requestDto);
        auditEventPublisher.publish(request, "ESPACIO", "UPDATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "zonaId", response.getIdZona(),
                "estado", response.getEstado()
        ), "audit.espacio.update");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEspacio(@PathVariable UUID id,
                                                HttpServletRequest request) {
        auditEventPublisher.publish(request, "ESPACIO", "DELETE", Map.of("id", id.toString()), "audit.espacio.delete");
        espacioService.eliminarEspacio(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<EspacioResponseDto> cambiarEstado(@PathVariable UUID id,
                                                            @RequestParam EstadoEspacio estado,
                                                            HttpServletRequest request) {
        EspacioResponseDto response = espacioService.cambiarEstado(id, estado);
        auditEventPublisher.publish(request, "ESPACIO", "UPDATE", Map.of(
                "id", response.getId(),
                "estado", response.getEstado()
        ), "audit.espacio.update");
        return ResponseEntity.ok(response);
    }
}
