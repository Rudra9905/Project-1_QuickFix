package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.BookingRequestDTO;
import com.quickhelper.backend.exception.BadRequestException;
import com.quickhelper.backend.model.Booking;
import com.quickhelper.backend.model.BookingStatus;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ProfileStatus;
import com.quickhelper.backend.repository.BookingRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.TaskScheduler;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TaskScheduler taskScheduler;

    @InjectMocks
    private BookingService bookingService;

    private User regularUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private Booking booking;

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setId(1L);
        regularUser.setName("Regular User");
        regularUser.setEmail("user@example.com");
        regularUser.setRole(UserRole.USER);

        providerUser = new User();
        providerUser.setId(2L);
        providerUser.setName("Provider User");
        providerUser.setEmail("provider@example.com");
        providerUser.setRole(UserRole.PROVIDER);

        providerProfile = new ProviderProfile();
        providerProfile.setId(1L);
        providerProfile.setUser(providerUser);
        providerProfile.setProfileStatus(ProfileStatus.APPROVED);
        providerProfile.setIsAvailable(true);

        booking = new Booking();
        booking.setId(1L);
        booking.setUser(regularUser);
        booking.setProvider(providerUser);
        booking.setServiceType(ServiceType.PLUMBER);
        booking.setStatus(BookingStatus.REQUESTED);
    }

    @Test
    void testCreateBooking_Success_SingleBooking_TimerScheduled() {
        // Given
        BookingRequestDTO request = new BookingRequestDTO();
        request.setProviderId(2L);
        request.setServiceType(ServiceType.PLUMBER);
        request.setNote("Need plumbing service");
        // isMultipleBooking is null by default

        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(providerProfileRepository.findByUser(providerUser)).thenReturn(Optional.of(providerProfile));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        var result = bookingService.createBooking(1L, request);

        // Then
        assertNotNull(result);
        assertEquals(BookingStatus.REQUESTED, result.getStatus());
        verify(bookingRepository).save(any(Booking.class));
        // Verify timer was scheduled
        verify(taskScheduler).schedule(any(Runnable.class), any(java.time.Instant.class));
    }

    @Test
    void testCreateBooking_Success_MultipleBooking_NoTimer() {
        // Given
        BookingRequestDTO request = new BookingRequestDTO();
        request.setProviderId(2L);
        request.setServiceType(ServiceType.PLUMBER);
        request.setNote("Multiple booking");
        request.setMultipleBooking(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(regularUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(providerUser));
        when(providerProfileRepository.findByUser(providerUser)).thenReturn(Optional.of(providerProfile));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        var result = bookingService.createBooking(1L, request);

        // Then
        assertNotNull(result);
        assertEquals(BookingStatus.REQUESTED, result.getStatus());
        verify(bookingRepository).save(any(Booking.class));
        // Verify timer was NOT scheduled
        verify(taskScheduler, never()).schedule(any(Runnable.class), any(java.time.Instant.class));
    }

    @Test
    void testCreateBooking_UserNotUserRole() {
        // Given
        BookingRequestDTO request = new BookingRequestDTO();
        request.setProviderId(2L);
        request.setServiceType(ServiceType.PLUMBER);

        User wrongUser = new User();
        wrongUser.setId(1L);
        wrongUser.setRole(UserRole.PROVIDER);

        when(userRepository.findById(1L)).thenReturn(Optional.of(wrongUser));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            bookingService.createBooking(1L, request);
        });
    }

    @Test
    void testAcceptBooking_Success() {
        // Given
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        var result = bookingService.acceptBooking(1L);

        // Then
        assertNotNull(result);
        assertEquals(BookingStatus.ACCEPTED, result.getStatus());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void testAcceptBooking_NotRequested() {
        // Given
        booking.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            bookingService.acceptBooking(1L);
        });
    }

    @Test
    void testRejectBooking_Success() {
        // Given
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        var result = bookingService.rejectBooking(1L);

        // Then
        assertNotNull(result);
        assertEquals(BookingStatus.REJECTED, result.getStatus());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void testCompleteBooking_Success() {
        // Given
        booking.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        // When
        var result = bookingService.completeBooking(1L);

        // Then
        assertNotNull(result);
        assertEquals(BookingStatus.COMPLETED, result.getStatus());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void testCompleteBooking_NotAccepted() {
        // Given
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            bookingService.completeBooking(1L);
        });
    }
}
