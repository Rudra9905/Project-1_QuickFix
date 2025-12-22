package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.ProfileStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Provider profile projection returned by APIs
public class ProviderResponseDTO {
    public ProviderResponseDTO(Long id, Long userId, ServiceType serviceType, ProfileStatus profileStatus, Integer experienceYears, String resumeUrl, String demoVideoUrl, String description, Integer basePrice, Double rating, Boolean isAvailable, Boolean isApproved, Double locationLat, Double locationLng, String rejectionReason, String displayName, String profilePhotoUrl, String tagline) {
        this.id = id;
        this.userId = userId;
        this.serviceType = serviceType;
        this.profileStatus = profileStatus;
        this.experienceYears = experienceYears;
        this.resumeUrl = resumeUrl;
        this.demoVideoUrl = demoVideoUrl;
        this.description = description;
        this.basePrice = basePrice;
        this.rating = rating;
        this.isAvailable = isAvailable;
        this.isApproved = isApproved;
        this.locationLat = locationLat;
        this.locationLng = locationLng;
        this.rejectionReason = rejectionReason;
        this.displayName = displayName;
        this.profilePhotoUrl = profilePhotoUrl;
        this.tagline = tagline;
    }
    private Long id;
    private Long userId;
    private ServiceType serviceType;
    private ProfileStatus profileStatus;
    private Integer experienceYears;
    private String resumeUrl;
    private String demoVideoUrl;
    private String description;
    private Integer basePrice;
    private Double rating;
    private Boolean isAvailable;
    private Boolean isApproved;
    private Double locationLat;
    private Double locationLng;
    private String rejectionReason;
    private String displayName;
    private String profilePhotoUrl;
    private String tagline;
    private List<String> portfolioImages;
    private UserInfo user; // User information for display

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String name;
        private String city;
    }
}
