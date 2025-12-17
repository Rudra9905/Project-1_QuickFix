package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.ServiceOfferingRequestDTO;
import com.quickhelper.backend.dto.ServiceOfferingResponseDTO;
import com.quickhelper.backend.service.ServiceOfferingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/providers/{providerId}/services")
@RequiredArgsConstructor
// Manages provider-specific service offerings (multiple services per provider)
public class ServiceOfferingController {

    private final ServiceOfferingService serviceOfferingService;

    @GetMapping
    public ResponseEntity<List<ServiceOfferingResponseDTO>> list(@PathVariable Long providerId) {
        return ResponseEntity.ok(serviceOfferingService.listByProvider(providerId));
    }

    @PostMapping
    public ResponseEntity<ServiceOfferingResponseDTO> create(
            @PathVariable Long providerId,
            @Valid @RequestBody ServiceOfferingRequestDTO request
    ) {
        ServiceOfferingResponseDTO created = serviceOfferingService.create(providerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{serviceId}")
    public ResponseEntity<ServiceOfferingResponseDTO> update(
            @PathVariable Long providerId,
            @PathVariable Long serviceId,
            @Valid @RequestBody ServiceOfferingRequestDTO request
    ) {
        ServiceOfferingResponseDTO updated = serviceOfferingService.update(providerId, serviceId, request);
        return ResponseEntity.ok(updated);
    }
}



