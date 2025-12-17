package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.AvailabilityUpdateDTO;
import com.quickhelper.backend.dto.LocationUpdateDTO;
import com.quickhelper.backend.dto.ProviderCreateRequestDTO;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import com.quickhelper.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProviderServiceTest {

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProviderService providerService;

    private User providerUser;
    private ProviderProfile providerProfile;

    @BeforeEach
    void setUp() {
        providerUser = new User();
        providerUser.setId(1L);
        providerUser.setName("Provider User");
        providerUser.setEmail("provider@example.com");
        providerUser.setRole(UserRole.PROVIDER);

        providerProfile = new ProviderProfile();
        providerProfile.setId(1L);
        providerProfile.setUser(providerUser);
        providerProfile.setServiceType(ServiceType.PLUMBER);
        providerProfile.setBasePrice(100);
        providerProfile.setLocationLat(40.7128);
        providerProfile.setLocationLng(-74.0060);
        providerProfile.setIsAvailable(true);
        providerProfile.setRating(4.5);
    }

    @Test
    void testCreateProviderProfile_Success() {
        // Given
        ProviderCreateRequestDTO request = new ProviderCreateRequestDTO();
        request.setServiceType(ServiceType.PLUMBER);
        request.setDescription("Expert plumber");
        request.setBasePrice(100);
        request.setLocationLat(40.7128);
        request.setLocationLng(-74.0060);

        when(userRepository.findById(1L)).thenReturn(Optional.of(providerUser));
        when(providerProfileRepository.findByUser(providerUser)).thenReturn(Optional.empty());
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenReturn(providerProfile);

        // When
        var result = providerService.createProviderProfile(1L, request);

        // Then
        assertNotNull(result);
        assertEquals(ServiceType.PLUMBER, result.getServiceType());
        verify(providerProfileRepository).save(any(ProviderProfile.class));
    }

    @Test
    void testUpdateLocation_Success() {
        // Given
        LocationUpdateDTO request = new LocationUpdateDTO();
        request.setLocationLat(40.7580);
        request.setLocationLng(-73.9855);

        when(providerProfileRepository.findById(1L)).thenReturn(Optional.of(providerProfile));
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenReturn(providerProfile);

        // When
        var result = providerService.updateLocation(1L, request);

        // Then
        assertNotNull(result);
        verify(providerProfileRepository).save(any(ProviderProfile.class));
    }

    @Test
    void testUpdateLocation_NotFound() {
        // Given
        LocationUpdateDTO request = new LocationUpdateDTO();
        request.setLocationLat(40.7580);
        request.setLocationLng(-73.9855);

        when(providerProfileRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            providerService.updateLocation(1L, request);
        });
    }

    @Test
    void testUpdateAvailability_Success() {
        // Given
        AvailabilityUpdateDTO request = new AvailabilityUpdateDTO();
        request.setIsAvailable(false);

        when(providerProfileRepository.findById(1L)).thenReturn(Optional.of(providerProfile));
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenReturn(providerProfile);

        // When
        var result = providerService.updateAvailability(1L, request);

        // Then
        assertNotNull(result);
        verify(providerProfileRepository).save(any(ProviderProfile.class));
    }
}
