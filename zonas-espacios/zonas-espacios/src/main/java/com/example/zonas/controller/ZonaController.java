package com.example.zonas.controller;

import com.example.zonas.dto.request.ZonaRequestDto;
import com.example.zonas.dto.response.ZonaResponseDto;
import com.example.zonas.services.interfaz.ZonaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/zonas")
@RequiredArgsConstructor
public class ZonaController {

    private final ZonaService zonaService;

    @GetMapping
    public ResponseEntity<List<ZonaResponseDto>> listarZonas() {
        return ResponseEntity.ok(zonaService.listarZonas());
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ZonaResponseDto>> buscarZonas(@RequestParam String nombre) {
        return ResponseEntity.ok(zonaService.buscarZonas(nombre));
    }

    @PostMapping
    public ResponseEntity<ZonaResponseDto> crearZona(@Valid @RequestBody ZonaRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zonaService.crearZona(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ZonaResponseDto> actualizarZona(
            @PathVariable UUID id,
            @Valid @RequestBody ZonaRequestDto requestDto) {
        return ResponseEntity.ok(zonaService.actualizarZona(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarZona(@PathVariable UUID id) {
        zonaService.eliminarZona(id);
        return ResponseEntity.noContent().build();
    }
}