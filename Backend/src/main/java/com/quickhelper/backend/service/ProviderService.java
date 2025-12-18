package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.*;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.model.ProfileStatus;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.util.DistanceCalculator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProviderService {

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private UserRepository userRepository;

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
        profile.setExperienceYears(request.getExperienceYears());
        profile.setResumeUrl(request.getResumeUrl());
        profile.setDemoVideoUrl(request.getDemoVideoUrl());
        profile.setLocationLat(request.getLocationLat());
        profile.setLocationLng(request.getLocationLng());
        profile.setIsAvailable(true);
        profile.setIsApproved(false);
        profile.setProfileStatus(ProfileStatus.INCOMPLETE);
        profile.setRating(0.0);

        ProviderProfile saved = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(saved);
    }
    
    // Overloaded method for AuthController
    @Transactional
    // Convenience overload allowing raw parameters from registration flow
    public ProviderResponseDTO createProviderProfile(Long userId, com.quickhelper.backend.model.ServiceType serviceType, String description, Double basePrice, Double locationLat, Double locationLng) {
        ProviderCreateRequestDTO request = new ProviderCreateRequestDTO();
        request.setServiceType(serviceType);
        request.setDescription(description);
        request.setBasePrice(basePrice != null ? basePrice.intValue() : null); // Convert Double to Integer
        request.setLocationLat(locationLat);
        request.setLocationLng(locationLng);
        return createProviderProfile(userId, request);
    }

    @Transactional
    // Allows provider to update profile details before submission
    public ProviderResponseDTO updateProviderProfile(Long profileId, ProviderUpdateRequestDTO request) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        if (profile.getProfileStatus() == ProfileStatus.PENDING_APPROVAL || profile.getProfileStatus() == ProfileStatus.APPROVED) {
            throw new IllegalStateException("Profile cannot be edited while under review or after approval");
        }

        // Core editable fields
        profile.setServiceType(request.getServiceType());
        profile.setDescription(request.getDescription());
        profile.setExperienceYears(request.getExperienceYears());
        profile.setBasePrice(request.getBasePrice());
        profile.setLocationLat(request.getLocationLat());
        profile.setLocationLng(request.getLocationLng());

        // IMPORTANT: Do NOT overwrite resume/demo video here.
        // They are managed via dedicated upload endpoints so that
        // updating text fields does not accidentally clear the URLs.
        profile.setRejectionReason(null); // Clear previous rejection reason on update
        profile.setProfileStatus(ProfileStatus.INCOMPLETE);
        profile.setIsApproved(false);

        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    @Transactional
    // Provider submits their profile for admin review
    public ProviderResponseDTO submitForReview(Long profileId) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        validateProfileCompleteness(profile);

        profile.setProfileStatus(ProfileStatus.PENDING_APPROVAL);
        profile.setIsApproved(false);
        profile.setIsAvailable(false); // freeze availability during review
        profile.setRejectionReason(null);

        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    @Transactional
    public ProviderResponseDTO updateResume(Long profileId, String resumeUrl) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        if (profile.getProfileStatus() == ProfileStatus.PENDING_APPROVAL || profile.getProfileStatus() == ProfileStatus.APPROVED) {
            throw new IllegalStateException("Profile cannot be edited while under review or after approval");
        }

        profile.setResumeUrl(resumeUrl);
        profile.setProfileStatus(ProfileStatus.INCOMPLETE);
        profile.setIsApproved(false);
        profile.setRejectionReason(null);
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    @Transactional
    public ProviderResponseDTO updateDemoVideo(Long profileId, String demoVideoUrl) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        if (profile.getProfileStatus() == ProfileStatus.PENDING_APPROVAL || profile.getProfileStatus() == ProfileStatus.APPROVED) {
            throw new IllegalStateException("Profile cannot be edited while under review or after approval");
        }

        profile.setDemoVideoUrl(demoVideoUrl);
        profile.setProfileStatus(ProfileStatus.INCOMPLETE);
        profile.setIsApproved(false);
        profile.setRejectionReason(null);
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    // Admin: list providers awaiting approval
    public List<ProviderResponseDTO> listPendingProviders() {
        return providerProfileRepository.findByProfileStatus(ProfileStatus.PENDING_APPROVAL)
                .stream()
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    // Admin approves a provider profile
    public ProviderResponseDTO approveProvider(Long profileId) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        validateProfileCompleteness(profile);

        profile.setProfileStatus(ProfileStatus.APPROVED);
        profile.setIsApproved(true);
        profile.setRejectionReason(null);
        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    @Transactional
    // Admin rejects a provider profile
    public ProviderResponseDTO rejectProvider(Long profileId, String reason) {
        ProviderProfile profile = providerProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found with id: " + profileId));

        profile.setProfileStatus(ProfileStatus.REJECTED);
        profile.setIsApproved(false);
        profile.setIsAvailable(false);
        profile.setRejectionReason(reason);

        ProviderProfile updated = providerProfileRepository.save(profile);
        return mapToProviderResponseDTO(updated);
    }

    private void validateProfileCompleteness(ProviderProfile profile) {
        if (profile.getServiceType() == null ||
                profile.getDescription() == null || profile.getDescription().isBlank() ||
                profile.getBasePrice() == null ||
                profile.getExperienceYears() == null ||
                profile.getResumeUrl() == null || profile.getResumeUrl().isBlank() ||
                profile.getDemoVideoUrl() == null || profile.getDemoVideoUrl().isBlank()) {
            throw new IllegalStateException("Profile is incomplete. Please provide service type, description, experience, base price, resume, and demo video.");
        }
    }

    // Returns all providers, optionally filtered by city
    public List<ProviderResponseDTO> getAllProviders(String city) {
        List<ProviderProfile> profiles;
        if (city != null && !city.trim().isEmpty()) {
            System.out.println("Getting approved providers for city: " + city);
            profiles = providerProfileRepository.findByUserCity(city);
        } else {
            System.out.println("Getting all approved providers");
            profiles = providerProfileRepository.findAll();
        }
        System.out.println("Found " + profiles.size() + " providers");
        return profiles.stream()
                .filter(p -> p.getProfileStatus() == ProfileStatus.APPROVED)
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
                .filter(p -> p.getProfileStatus() == ProfileStatus.APPROVED)
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
    public List<ProviderResponseDTO> getAvailableProviders(com.quickhelper.backend.model.ServiceType serviceType, String city) {
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
                .filter(p -> p.getProfileStatus() == ProfileStatus.APPROVED)
                .map(this::mapToProviderResponseDTO)
                .collect(Collectors.toList());
    }

    // Returns only available providers for a service type within a specified distance
    public List<ProviderResponseDTO> getAvailableProvidersWithinDistance(com.quickhelper.backend.model.ServiceType serviceType, Double userLat, Double userLng, Double maxDistanceKm) {
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
                .filter(p -> p.getProfileStatus() == ProfileStatus.APPROVED)
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

    // Fetches a provider profile by user id
    public ProviderResponseDTO getProviderByUserId(Long userId) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found for user id: " + userId));
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

        if (profile.getProfileStatus() != ProfileStatus.APPROVED) {
            throw new IllegalStateException("Only approved providers can change availability");
        }

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
                profile.getProfileStatus(),
                profile.getExperienceYears(),
                profile.getResumeUrl(),
                profile.getDemoVideoUrl(),
                profile.getDescription(),
                profile.getBasePrice(),
                profile.getRating(),
                profile.getIsAvailable(),
                profile.getIsApproved(),
                profile.getLocationLat(),
                profile.getLocationLng(),
                profile.getRejectionReason()
        );
    }
}
