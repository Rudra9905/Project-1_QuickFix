package com.quickhelper.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
// Admin decision payload for approving/rejecting a provider
public class ProviderReviewDecisionDTO {
    @NotBlank(message = "Decision is required")
    private String decision; // APPROVE or REJECT

    private String rejectionReason;
}
