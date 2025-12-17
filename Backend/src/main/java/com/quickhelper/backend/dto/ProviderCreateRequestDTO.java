package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
// Request body for creating a provider profile
public class ProviderCreateRequestDTO {
    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    private String description;

    @Positive(message = "Base price must be positive")
    private Integer basePrice;

    private Double locationLat;

    private Double locationLng;
}
