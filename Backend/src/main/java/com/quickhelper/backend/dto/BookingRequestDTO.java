package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
// Request body for creating a booking
public class BookingRequestDTO {
    @NotNull(message = "Provider ID is required")
    private Long providerId;

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    private String note;
}
