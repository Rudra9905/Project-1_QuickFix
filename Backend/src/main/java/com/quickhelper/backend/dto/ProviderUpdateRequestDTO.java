package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;

@Data
// Request body for updating a provider profile (allowed when not under review)
public class ProviderUpdateRequestDTO {
    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    @NotNull(message = "Description is required")
    private String description;

    @PositiveOrZero(message = "Experience must be zero or a positive number")
    private Integer experienceYears;

    private String resumeUrl;

    private String demoVideoUrl;

    @Positive(message = "Base price must be positive")
    private Integer basePrice;

    private Double locationLat;

    private Double locationLng;
    
    private List<String> portfolioImages;
    
    private String displayName; // Provider's display/business name
    
    private String profilePhotoUrl; // Profile photo URL
    
    private String tagline; // Professional tagline
}
