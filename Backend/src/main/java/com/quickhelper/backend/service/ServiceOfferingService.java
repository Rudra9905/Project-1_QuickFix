package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.ServiceOfferingRequestDTO;
import com.quickhelper.backend.dto.ServiceOfferingResponseDTO;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceOffering;
import com.quickhelper.backend.repository.ServiceOfferingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceOfferingService {
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProviderService providerService;

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponseDTO> listByProvider(Long providerId) {
        ProviderProfile provider = providerService.getProviderEntity(providerId);
        return serviceOfferingRepository.findByProviderProfileId(provider.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceOfferingResponseDTO create(Long providerId, ServiceOfferingRequestDTO request) {
        ProviderProfile provider = providerService.getProviderEntity(providerId);
        ServiceOffering offering = new ServiceOffering();
        offering.setProviderProfile(provider);
        offering.setName(request.getName());
        offering.setDescription(request.getDescription());
        offering.setPrice(request.getPrice());
        offering.setUnit(request.getUnit());
        offering.setActive(request.getActive() != null ? request.getActive() : true);
        ServiceOffering saved = serviceOfferingRepository.save(offering);
        return toDto(saved);
    }

    @Transactional
    public ServiceOfferingResponseDTO update(Long providerId, Long offeringId, ServiceOfferingRequestDTO request) {
        ProviderProfile provider = providerService.getProviderEntity(providerId);
        ServiceOffering offering = serviceOfferingRepository.findById(offeringId)
                .filter(o -> o.getProviderProfile().getId().equals(provider.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Service offering not found for provider"));

        offering.setName(request.getName());
        offering.setDescription(request.getDescription());
        offering.setPrice(request.getPrice());
        offering.setUnit(request.getUnit());
        offering.setActive(request.getActive() != null ? request.getActive() : offering.getActive());
        ServiceOffering saved = serviceOfferingRepository.save(offering);
        return toDto(saved);
    }

    private ServiceOfferingResponseDTO toDto(ServiceOffering offering) {
        return new ServiceOfferingResponseDTO(
                offering.getId(),
                offering.getProviderProfile().getId(),
                offering.getName(),
                offering.getDescription(),
                offering.getPrice(),
                offering.getUnit(),
                offering.getActive()
        );
    }
}



