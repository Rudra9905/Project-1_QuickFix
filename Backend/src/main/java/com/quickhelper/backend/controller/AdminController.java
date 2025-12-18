package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.ProviderResponseDTO;
import com.quickhelper.backend.dto.ProviderReviewDecisionDTO;
import com.quickhelper.backend.service.ProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/providers")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
// Admin-only endpoints for provider review and approvals
public class AdminController {
    private final ProviderService providerService;

    @GetMapping("/pending")
    public ResponseEntity<List<ProviderResponseDTO>> listPendingProviders() {
        return ResponseEntity.ok(providerService.listPendingProviders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProviderResponseDTO> getProvider(@PathVariable Long id) {
        return ResponseEntity.ok(providerService.getProviderById(id));
    }

    @PostMapping("/{id}/decision")
    public ResponseEntity<ProviderResponseDTO> reviewProvider(
            @PathVariable Long id,
            @Valid @RequestBody ProviderReviewDecisionDTO decisionDto) {
        String decision = decisionDto.getDecision().toUpperCase();
        if ("APPROVE".equals(decision)) {
            return ResponseEntity.ok(providerService.approveProvider(id));
        }
        return ResponseEntity.ok(providerService.rejectProvider(id, decisionDto.getRejectionReason()));
    }
}
