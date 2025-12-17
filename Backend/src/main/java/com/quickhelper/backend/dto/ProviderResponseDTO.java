package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Provider profile projection returned by APIs
public class ProviderResponseDTO {
    private Long id;
    private Long userId;
    private ServiceType serviceType;
    private String description;
    private Integer basePrice;
    private Double rating;
    private Boolean isAvailable;
    private Double locationLat;
    private Double locationLng;
}
