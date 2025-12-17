package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.AvailabilityUpdateDTO;
import com.quickhelper.backend.dto.LocationUpdateDTO;
import com.quickhelper.backend.dto.ProviderCreateRequestDTO;
import com.quickhelper.backend.dto.ProviderResponseDTO;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.util.DistanceCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Manages provider profiles, availability, and discovery
public class ProviderService {
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    // Creates a provider profile for a given user (must have PROVIDER role)
    public ProviderResponseDTO createProviderProfile(Long userId, ProviderCreateRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() != UserRole.PROVIDER) {
            throw new IllegalArgumentException("User must have PROVIDER role");
        }

        if (providerProfileRepository.findByUser(user).isPresent()) {
            throw new IllegalArgumentException("Provider profile already exists for this user");
        }

        ProviderProfile profile = new ProviderProfile();
        profile.setUser(user);
        profile.setServiceType(request.getServiceType());
        profile.setDescription(request.getDescription());
        profile.setBasePrice(request.getBasePrice());
        profile.setLocationLat(request.getLocationLat());
        profile.setLocationLng(request.getLocationLng());
        profile.setIsAvailable(true);
        profile.setRating(0.0);

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(saved);
    }
    
    // Overloaded method for AuthController
    @Transactional
    // Convenience overload allowing raw parameters from registration flow
    public ProviderResponseDTO createProviderProfile(Long userId, ServiceType serviceType, String description, Double basePrice, Double locationLat, Double locationLng) {
        ProviderCreateRequestDTO request = new ProviderCreateRequestDTO();
        request.setServiceType(serviceType);
        request.setDescription(description);
        request.setBasePrice(basePrice != null ? basePrice.intValue() : null); // Convert Double to Integer
        request.setLocationLat(locationLat);
        request.setLocationLng(locationLng);
        return createProviderProfile(userId, request);
    }

    // Returns all providers, optionally filtered by city
    public List<ProviderResponseDTO> getAllProviders(String city) {
        List<ProviderProfile> profiles;
        if (city != null && !city.trim().isEmpty()) {
            System.out.println("Getting providers for city: " + city);
            profiles = providerProfileRepository.findByUserCity(city);
        } else {
            System.out.println("Getting all providers");
            profiles = providerProfileRepository.findAll();
        }
        System.out.println("Found " + profiles.size() + " providers");
        return profiles.stream()
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
    }

    // Returns all providers within a specified distance from user coordinates
    public List<ProviderResponseDTO> getAllProvidersWithinDistance(Double userLat, Double userLng, Double maxDistanceKm) {
        System.out.println("getAllProvidersWithinDistance called with: userLat=" + userLat + 
                          ", userLng=" + userLng + ", maxDistanceKm=" + maxDistanceKm);
        
        // Validate inputs
        if (userLat == null || userLng == null || maxDistanceKm == null) {
            System.out.println("Invalid input: null parameter detected");
            return new ArrayList<>(); // Return empty list
        }
        
        if (Double.isNaN(userLat) || Double.isNaN(userLng) || Double.isNaN(maxDistanceKm)) {
            System.out.println("Invalid input: NaN detected");
            return new ArrayList<>(); // Return empty list
        }
        
        if (Double.isInfinite(userLat) || Double.isInfinite(userLng) || Double.isInfinite(maxDistanceKm)) {
            System.out.println("Invalid input: Infinite value detected");
            return new ArrayList<>(); // Return empty list
        }
        
        List<ProviderProfile> profiles = providerProfileRepository.findAll();
        System.out.println("Total providers in database: " + profiles.size());
        
        List<ProviderResponseDTO> result = profiles.stream()
                .filter(profile -> profile.getLocationLat() != null && profile.getLocationLng() != null)
                .filter(profile -> {
                    double distance = DistanceCalculator.calculateDistance(
                            userLat, userLng, 
                            profile.getLocationLat(), profile.getLocationLng());
                    System.out.println("Provider " + profile.getId() + " distance: " + distance + " km");
                    return distance <= maxDistanceKm;
                })
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
                
        System.out.println("Providers within distance: " + result.size());
        return result;
    }

    // Returns only available providers for a service type (optional city)
    public List<ProviderResponseDTO> getAvailableProviders(ServiceType serviceType, String city) {
        List<ProviderProfile> profiles;
        if (city != null && !city.trim().isEmpty()) {
            System.out.println("Getting available providers for service " + serviceType + " in city: " + city);
            profiles = providerProfileRepository
                    .findByUserCityAndServiceTypeAndIsAvailableTrue(city, serviceType);
        } else {
            System.out.println("Getting all available providers for service: " + serviceType);
            profiles = providerProfileRepository
                    .findByServiceTypeAndIsAvailableTrue(serviceType);
        }
        System.out.println("Found " + profiles.size() + " available providers");
        return profiles.stream()
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
    }

    // Returns only available providers for a service type within a specified distance
    public List<ProviderResponseDTO> getAvailableProvidersWithinDistance(ServiceType serviceType, Double userLat, Double userLng, Double maxDistanceKm) {
        System.out.println("getAvailableProvidersWithinDistance called with: serviceType=" + serviceType +
                          ", userLat=" + userLat + ", userLng=" + userLng + ", maxDistanceKm=" + maxDistanceKm);
        
        // Validate inputs
        if (userLat == null || userLng == null || maxDistanceKm == null) {
            System.out.println("Invalid input: null parameter detected");
            return new ArrayList<>(); // Return empty list
        }
        
        if (Double.isNaN(userLat) || Double.isNaN(userLng) || Double.isNaN(maxDistanceKm)) {
            System.out.println("Invalid input: NaN detected");
            return new ArrayList<>(); // Return empty list
        }
        
        if (Double.isInfinite(userLat) || Double.isInfinite(userLng) || Double.isInfinite(maxDistanceKm)) {
            System.out.println("Invalid input: Infinite value detected");
            return new ArrayList<>(); // Return empty list
        }
        
        List<ProviderProfile> profiles = providerProfileRepository
                .findByServiceTypeAndIsAvailableTrue(serviceType);
        System.out.println("Available providers for service " + serviceType + ": " + profiles.size());
        
        List<ProviderResponseDTO> result = profiles.stream()
                .filter(profile -> profile.getLocationLat() != null && profile.getLocationLng() != null)
                .filter(profile -> {
                    double distance = DistanceCalculator.calculateDistance(
                            userLat, userLng,
                            profile.getLocationLat(), profile.getLocationLng());
                    System.out.println("Provider " + profile.getId() + " distance: " + distance + " km");
                    return distance <= maxDistanceKm;
                })
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
                
        System.out.println("Available providers within distance: " + result.size());
        return result;
    }

    // Fetches a provider profile by id
    public ProviderResponseDTO getProviderById(Long id) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + id));
        return mapToProviderResponseDTO(profile);
    }

    // Internal helper for other services to fetch entity
    public ProviderProfile getProviderEntity(Long id) {
        return providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + id));
    }

    @Transactional
    // Updates availability flag for a provider profile
    public ProviderResponseDTO updateAvailability(Long id, AvailabilityUpdateDTO request) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + id));
        profile.setIsAvailable(request.getIsAvailable());
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    @Transactional
    // Updates latitude/longitude for a provider profile
    public ProviderResponseDTO updateLocation(Long id, LocationUpdateDTO request) {
        ProviderProfile profile = providerProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + id));
        profile.setLocationLat(request.getLocationLat());
        profile.setLocationLng(request.getLocationLng());
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    private ProviderResponseDTO mapToProviderResponseDTO(ProviderProfile profile) {
        return new ProviderResponseDTO(
                profile.getId(),
                profile.getUser().getId(),
                profile.getServiceType(),
                profile.getDescription(),
                profile.getBasePrice(),
                profile.getRating(),
                profile.getIsAvailable(),
                profile.getLocationLat(),
                profile.getLocationLng()
        );
    }
}