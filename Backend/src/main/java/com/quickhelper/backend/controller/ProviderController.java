package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.*;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.service.ProviderService;
import com.quickhelper.backend.service.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ProviderController {

    @Autowired
    private ProviderService providerService;

    @Autowired
    private FileStorageService fileStorageService;

    @PutMapping("/{id}")
    // Updates provider profile details (only when not under review/approved)
    public ResponseEntity<ProviderResponseDTO> updateProviderProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProviderUpdateRequestDTO request) {
        ProviderResponseDTO profile = providerService.updateProviderProfile(id, request);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/{id}/submit")
    // Provider submits profile for admin review
    public ResponseEntity<ProviderResponseDTO> submitForReview(@PathVariable Long id) {
        ProviderResponseDTO profile = providerService.submitForReview(id);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/{id}/resume")
    // Upload resume PDF and attach to profile
    public ResponseEntity<ProviderResponseDTO> uploadResume(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            System.out.println("Uploading resume for provider ID: " + id);
            String url = fileStorageService.storeFile(
                    file,
                    Set.of("application/pdf"),
                    5 * 1024 * 1024, // 5MB
                    "resumes");
            ProviderResponseDTO profile = providerService.updateResume(id, url);
            System.out.println("Resume uploaded successfully for provider ID: " + id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.err.println("Error uploading resume for provider ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/demo-video")
    // Upload demo video file (mp4) and attach to profile
    public ResponseEntity<ProviderResponseDTO> uploadDemoVideo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            System.out.println("Uploading demo video for provider ID: " + id);
            String url = fileStorageService.storeFile(
                    file,
                    Set.of("video/mp4", "video/quicktime"),
                    20 * 1024 * 1024, // 20MB
                    "videos");
            ProviderResponseDTO profile = providerService.updateDemoVideo(id, url);
            System.out.println("Demo video uploaded successfully for provider ID: " + id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.err.println("Error uploading demo video for provider ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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
            @RequestParam(required = false) com.quickhelper.backend.model.ServiceType serviceType,
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
            System.out.println("No location information provided. Returning all approved providers without geo filter.");
            // Fallback: return all approved providers when no location info is available
            providers = providerService.getAllProviders(null);
        }
        
        System.out.println("Returning " + providers.size() + " providers");
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/available")
    // Lists only available providers for a service type (optional city or distance filter)
    public ResponseEntity<List<ProviderResponseDTO>> getAvailableProviders(
            @RequestParam com.quickhelper.backend.model.ServiceType serviceType,
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
            System.out.println("No location information provided. Returning all available providers for service without geo filter.");
            // Fallback: return all available providers for the service when no location info is available
            providers = providerService.getAvailableProviders(serviceType, null);
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

    @GetMapping("/user/{userId}")
    // Fetches a provider profile by user id
    public ResponseEntity<ProviderResponseDTO> getProviderByUserId(@PathVariable Long userId) {
        ProviderResponseDTO provider = providerService.getProviderByUserId(userId);
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
