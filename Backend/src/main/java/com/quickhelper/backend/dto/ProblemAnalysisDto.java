package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemAnalysisDto {
    private String issueDescription;
    private ServiceType detectedServiceType;
    private List<ProviderProfile> recommendedProviders;
}
