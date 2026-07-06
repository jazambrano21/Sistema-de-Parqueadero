package com.example.zonas.controller;

import com.example.zonas.audit.AuditEventPublisher;
import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.services.interfaz.ZonaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/zonas")
@RequiredArgsConstructor
public class ZonaController {

    private final ZonaService zonaService;
    private final AuditEventPublisher auditEventPublisher;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas() {
        return ResponseEntity.ok(zonaService.listarZonas());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ZonaResponseDto>> buscarZonas(@RequestParam String nombre) {
        return ResponseEntity.ok(zonaService.buscarZonas(nombre));
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto requestDto,
                                                      HttpServletRequest request) {
        ZonaResponseDto response = zonaService.crearZona(requestDto);
        auditEventPublisher.publish(request, "ZONA", "CREATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "tipo", response.getTipo(),
                "codigo", response.getCodigo()
        ), "audit.zona.create");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
            @PathVariable UUID id,
            @Valid @RequestBody ZonaRequestDto requestDto,
            HttpServletRequest request) {
        ZonaResponseDto response = zonaService.actualizarZona(id, requestDto);
        auditEventPublisher.publish(request, "ZONA", "UPDATE", Map.of(
                "id", response.getId(),
                "nombre", response.getNombre(),
                "tipo", response.getTipo(),
                "codigo", response.getCodigo()
        ), "audit.zona.update");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarZona(@PathVariable UUID id,
                                             HttpServletRequest request) {
        auditEventPublisher.publish(request, "ZONA", "DELETE", Map.of("id", id.toString()), "audit.zona.delete");
        zonaService.eliminarZona(id);
        return ResponseEntity.noContent().build();
    }
}