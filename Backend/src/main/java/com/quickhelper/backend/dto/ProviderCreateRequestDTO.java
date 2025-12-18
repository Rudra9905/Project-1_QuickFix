package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
// Request body for creating a provider profile
public class ProviderCreateRequestDTO {
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
}
