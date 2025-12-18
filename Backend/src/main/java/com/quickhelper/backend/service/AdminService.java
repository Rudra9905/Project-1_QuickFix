package com.quickhelper.backend.service;

import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ProfileStatus;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final ProviderProfileRepository providerProfileRepository;
    
    public List<ProviderProfile> listPendingProviders() {
        return providerProfileRepository.findByProfileStatus(ProfileStatus.PENDING_APPROVAL);
    }
    
    public ProviderProfile getProviderById(Long id) {
        return providerProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + id));
    }
    
    public ProviderProfile approveProvider(Long id) {
        ProviderProfile profile = getProviderById(id);
        profile.setProfileStatus(ProfileStatus.APPROVED);
        profile.setIsApproved(true);
        profile.setRejectionReason(null);
        return providerProfileRepository.save(profile);
    }
    
    public ProviderProfile rejectProvider(Long id, String reason) {
        ProviderProfile profile = getProviderById(id);
        profile.setProfileStatus(ProfileStatus.REJECTED);
        profile.setIsApproved(false);
        profile.setIsAvailable(false);
        profile.setRejectionReason(reason);
        return providerProfileRepository.save(profile);
    }
}