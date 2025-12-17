package com.quickhelper.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
// Request body to update provider latitude/longitude
public class LocationUpdateDTO {
    @NotNull(message = "Latitude is required")
    private Double locationLat;

    @NotNull(message = "Longitude is required")
    private Double locationLng;
}
