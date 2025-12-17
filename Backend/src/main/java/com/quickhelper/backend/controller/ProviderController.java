package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.AvailabilityUpdateDTO;
import com.quickhelper.backend.dto.LocationUpdateDTO;
import com.quickhelper.backend.dto.ProviderCreateRequestDTO;
import com.quickhelper.backend.dto.ProviderResponseDTO;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.service.ProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
// Provider profile CRUD plus availability and location updates
public class ProviderController {
    private final ProviderService providerService;

    @PostMapping
    // Creates a provider profile for a given user
    public ResponseEntity<ProviderResponseDTO> createProviderProfile(
            @RequestParam Long userId,
            @Valid @RequestBody ProviderCreateRequestDTO request) {
        ProviderResponseDTO profile = providerService.createProviderProfile(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(profile);
    }

    @GetMapping
    // Lists providers (optionally filtered by service type, city, or distance)
    public ResponseEntity<List<ProviderResponseDTO>> getAllProviders(
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng,
            @RequestParam(required = false) Double maxDistanceKm) {
        System.out.println("getAllProviders called with: serviceType=" + serviceType + ", city=" + city + 
                          ", userLat=" + userLat + ", userLng=" + userLng + ", maxDistanceKm=" + maxDistanceKm);
        
        // Validate distance parameters if provided
        if ((userLat != null || userLng != null || maxDistanceKm != null) &&
            (userLat == null || userLng == null || maxDistanceKm == null)) {
            System.out.println("Invalid distance parameters: all three must be provided together");
            // Return empty list for invalid parameters
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        List<ProviderResponseDTO> providers;
        
        // Priority: distance filter > city filter > no filter
        if (userLat != null && userLng != null && maxDistanceKm != null) {
            System.out.println("Using distance-based filtering");
            if (serviceType != null) {
                providers = providerService.getAvailableProvidersWithinDistance(serviceType, userLat, userLng, maxDistanceKm);
            } else {
                providers = providerService.getAllProvidersWithinDistance(userLat, userLng, maxDistanceKm);
            }
        } else if (city != null && !city.trim().isEmpty()) {
            System.out.println("Using city-based filtering: " + city);
            if (serviceType != null) {
                providers = providerService.getAvailableProviders(serviceType, city);
            } else {
                providers = providerService.getAllProviders(city);
            }
        } else {
            System.out.println("No location information provided. Enforcing geographic restrictions by returning empty list.");
            // Enforce geographic restrictions - don't return providers if no location info
            providers = new ArrayList<>();
        }
        
        System.out.println("Returning " + providers.size() + " providers");
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/available")
    // Lists only available providers for a service type (optional city or distance filter)
    public ResponseEntity<List<ProviderResponseDTO>> getAvailableProviders(
            @RequestParam ServiceType serviceType,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng,
            @RequestParam(required = false) Double maxDistanceKm) {
        System.out.println("getAvailableProviders called with: serviceType=" + serviceType + ", city=" + city + 
                          ", userLat=" + userLat + ", userLng=" + userLng + ", maxDistanceKm=" + maxDistanceKm);
        
        // Validate distance parameters if provided
        if ((userLat != null || userLng != null || maxDistanceKm != null) &&
            (userLat == null || userLng == null || maxDistanceKm == null)) {
            System.out.println("Invalid distance parameters: all three must be provided together");
            // Return empty list for invalid parameters
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        List<ProviderResponseDTO> providers;
        
        // Priority: distance filter > city filter > no filter
        if (userLat != null && userLng != null && maxDistanceKm != null) {
            System.out.println("Using distance-based filtering");
            providers = providerService.getAvailableProvidersWithinDistance(serviceType, userLat, userLng, maxDistanceKm);
        } else if (city != null && !city.trim().isEmpty()) {
            System.out.println("Using city-based filtering: " + city);
            providers = providerService.getAvailableProviders(serviceType, city);
        } else {
            System.out.println("No location information provided. Enforcing geographic restrictions by returning empty list.");
            // Enforce geographic restrictions - don't return providers if no location info
            providers = new ArrayList<>();
        }
        
        System.out.println("Returning " + providers.size() + " providers");
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/{id}")
    // Fetches a provider profile by id
    public ResponseEntity<ProviderResponseDTO> getProviderById(@PathVariable Long id) {
        ProviderResponseDTO provider = providerService.getProviderById(id);
        return ResponseEntity.ok(provider);
    }

    @PutMapping("/{id}/availability")
    // Toggles provider availability status
    public ResponseEntity<ProviderResponseDTO> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityUpdateDTO request) {
        ProviderResponseDTO provider = providerService.updateAvailability(id, request);
        return ResponseEntity.ok(provider);
    }

    @PutMapping("/{id}/location")
    // Updates provider geo-coordinates
    public ResponseEntity<ProviderResponseDTO> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationUpdateDTO request) {
        ProviderResponseDTO provider = providerService.updateLocation(id, request);
        return ResponseEntity.ok(provider);
    }
}
