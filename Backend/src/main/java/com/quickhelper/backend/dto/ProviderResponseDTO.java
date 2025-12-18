package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.ProfileStatus;
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
}
