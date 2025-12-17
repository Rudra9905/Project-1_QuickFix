package com.quickhelper.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
// Request body to toggle provider availability
public class AvailabilityUpdateDTO {
    @NotNull(message = "Availability status is required")
    private Boolean isAvailable;
}
