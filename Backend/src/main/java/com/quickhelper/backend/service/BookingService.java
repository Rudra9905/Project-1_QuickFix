package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.BookingRequestDTO;
import com.quickhelper.backend.dto.BookingResponseDTO;
import com.quickhelper.backend.dto.UserResponseDTO;
import com.quickhelper.backend.exception.BadRequestException;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.Booking;
import com.quickhelper.backend.model.BookingStatus;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.model.ProfileStatus;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.repository.BookingRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Handles booking lifecycle transitions and notification side-effects
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;
    private final org.springframework.scheduling.TaskScheduler taskScheduler;

    // Trigger restart for migration V1.5

    @Transactional
    // Creates a new booking request from a user to a provider
    public BookingResponseDTO createBooking(Long userId, BookingRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() != UserRole.USER) {
            throw new BadRequestException("Only users can create bookings");
        }

        User provider = userRepository.findById(request.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + request.getProviderId()));

        if (provider.getRole() != UserRole.PROVIDER) {
            throw new BadRequestException("Selected user is not a provider");
        }

        ProviderProfile providerProfile = providerProfileRepository.findByUser(provider)
                .orElseThrow(() -> new BadRequestException("Provider does not have a profile"));

        if (providerProfile.getProfileStatus() != ProfileStatus.APPROVED || !Boolean.TRUE.equals(providerProfile.getIsAvailable())) {
            throw new BadRequestException("Provider is not available for bookings");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        System.out.println("Processing booking request. Received bookingDate: " + request.getBookingDate());
        booking.setProvider(provider);
        booking.setServiceType(request.getServiceType());
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.REQUESTED);
        if (request.getBookingDate() != null) {
            try {
                booking.setBookingDate(java.time.LocalDate.parse(request.getBookingDate()));
            } catch (Exception e) {
                throw new BadRequestException("Invalid booking date format. Expected yyyy-MM-dd");
            }
        }
        booking.setPreferredTime(request.getPreferredTime());

        // Generate 6-digit OTP
        int otpValue = 100000 + new java.util.Random().nextInt(900000);
        booking.setStartJobOtp(String.valueOf(otpValue));

        Booking saved = bookingRepository.save(booking);
        
        // Removed auto-rejection timer - all bookings (including multiple/weekly) can be accepted without expiration
        
        try {
            // Send notification to provider
            System.out.println("Sending notification to provider: " + provider.getId());
            notificationService.notifyBookingRequestSent(
                    user.getId(),
                    provider.getId(),
                    saved.getId(),
                    request.getServiceType().toString()
            );
            System.out.println("Provider notification sent successfully");
        } catch (Exception e) {
            System.err.println("Error sending provider notification: " + e.getMessage());
            e.printStackTrace();
            // Continue even if notification fails
        }
        
        try {
            // Send notification to user
            System.out.println("Sending notification to user: " + user.getId());
            notificationService.createAndSendNotification(
                    user.getId(),
                    UserRole.USER,
                    com.quickhelper.backend.model.NotificationType.BOOKING_REQUEST_SENT,
                    "Booking Request Sent",
                    "Your booking request has been sent to " + provider.getName(),
                    false,
                    saved.getId()
            );
            System.out.println("User notification sent successfully");
        } catch (Exception e) {
            System.err.println("Error sending user notification: " + e.getMessage());
            e.printStackTrace();
            // Continue even if notification fails
        }
        
        return mapToBookingResponseDTO(saved);
    }

    @Transactional
    public void checkAndRejectBooking(Long bookingId) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            if (booking.getStatus() == BookingStatus.REQUESTED) {
                booking.setStatus(BookingStatus.REJECTED);
                if (booking.getNote() == null) {
                    booking.setNote("Auto-rejected due to timeout");
                } else {
                    booking.setNote(booking.getNote() + " (Auto-rejected due to timeout)");
                }
                bookingRepository.save(booking);
                
                // Notify user
                 notificationService.notifyBookingRejected(
                    booking.getUser().getId(),
                    booking.getId(),
                    booking.getProvider().getName()
                );
            }
        });
    }

    public List<BookingResponseDTO> getBookingsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return bookingRepository.findByUser(user).stream()
                .map(this::mapToBookingResponseDTO)
                .collect(Collectors.toList());
    }

    public List<BookingResponseDTO> getBookingsByProvider(Long providerId) {
        User provider = userRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + providerId));
        return bookingRepository.findByProvider(provider).stream()
                .map(this::mapToBookingResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    // Provider accepts a pending booking and triggers notifications
    public BookingResponseDTO acceptBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.REQUESTED) {
            throw new BadRequestException("Only REQUESTED bookings can be accepted");
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        booking.setAcceptedAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);
        
        // Send notifications
        notificationService.notifyBookingAccepted(
                booking.getUser().getId(),
                updated.getId(),
                booking.getProvider().getName()
        );
        
        notificationService.createAndSendNotification(
                booking.getProvider().getId(),
                UserRole.PROVIDER,
                com.quickhelper.backend.model.NotificationType.JOB_ACCEPTED,
                "Job Accepted",
                "You have accepted the booking request from " + booking.getUser().getName(),
                false,
                updated.getId()
        );
        
        return mapToBookingResponseDTO(updated);
    }

    @Transactional
    // Provider rejects a pending booking
    public BookingResponseDTO rejectBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.REQUESTED) {
            throw new BadRequestException("Only REQUESTED bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        Booking updated = bookingRepository.save(booking);
        
        // Send notification to user
        notificationService.notifyBookingRejected(
                booking.getUser().getId(),
                updated.getId(),
                booking.getProvider().getName()
        );
        
        return mapToBookingResponseDTO(updated);
    }

    @Transactional
    // Cancels a booking unless already completed/cancelled
    public BookingResponseDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel a " + booking.getStatus() + " booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updated = bookingRepository.save(booking);
        
        // Send notification to provider if cancelled by user
        if (booking.getUser().getRole() == com.quickhelper.backend.model.UserRole.USER) {
            notificationService.notifyBookingCancelled(
                    booking.getProvider().getId(),
                    updated.getId(),
                    booking.getUser().getName()
            );
        }
        
        return mapToBookingResponseDTO(updated);
    }

    @Transactional
    // Marks booking as completed and notifies both parties
    public BookingResponseDTO completeBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.ACCEPTED && booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new BadRequestException("Only ACCEPTED or IN_PROGRESS bookings can be completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);
        
        // Send notifications
        notificationService.notifyServiceCompleted(
                booking.getUser().getId(),
                booking.getProvider().getId(),
                updated.getId(),
                booking.getUser().getName()
        );
        
        // Notify provider about earnings
        notificationService.notifyEarningsCredited(
                booking.getProvider().getId(),
                updated.getId(),
                100.0 // Placeholder amount
        );

        return mapToBookingResponseDTO(booking);
    }

    @Transactional
    public BookingResponseDTO providerOnWay(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS && booking.getStatus() != BookingStatus.ACCEPTED) {
             // Relaxed check
        }
        
        // Send notification to user
        notificationService.notifyProviderOnWay(
                booking.getUser().getId(),
                booking.getId(),
                booking.getProvider().getName()
        );
        
        return mapToBookingResponseDTO(booking);
    }

    @Transactional
    public BookingResponseDTO providerArrived(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.IN_PROGRESS && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new BadRequestException("Booking must be IN_PROGRESS to mark arrival");
        }
        
        if (booking.getArrivedAt() != null) {
             throw new BadRequestException("Provider already marked as arrived");
        }

        booking.setArrivedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        
        // Notify user
        notificationService.notifyProviderArrived(
                booking.getUser().getId(),
                booking.getId(),
                booking.getProvider().getName()
        ); // Re-using this notification or creating a new specific one ideally

        return mapToBookingResponseDTO(saved);
    }

    @Transactional
    // Marks service start and notifies user (OTP Verification)
    public BookingResponseDTO startService(Long bookingId, String otp) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        // Modified: Allow starting if status is IN_PROGRESS (set at acceptance) or ACCEPTED (legacy/safety)
        if (booking.getStatus() != BookingStatus.IN_PROGRESS && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new BadRequestException("Only IN_PROGRESS or ACCEPTED bookings can start service");
        }
        
        // Check if already started
        if (booking.getStartedAt() != null) {
             throw new BadRequestException("Job already started");
        }

        // Verify OTP (Exempt Multiple Booking Packages)
        boolean isPackage = "Multiple Booking Package".equals(booking.getNote());
        
        if (!isPackage && (booking.getStartJobOtp() == null || !booking.getStartJobOtp().equals(otp))) {
            throw new BadRequestException("Invalid Start Job OTP");
        }

        // Date validation removed to allow flexible start times

        // Set startedAt timestamp
        booking.setStartedAt(LocalDateTime.now());
        // Ensure status is IN_PROGRESS (if not already)
        booking.setStatus(BookingStatus.IN_PROGRESS);
        
        Booking saved = bookingRepository.save(booking);

        // Send notification
        notificationService.notifyServiceStarted(booking.getUser().getId(), booking.getId(), booking.getProvider().getName());
        
        return mapToBookingResponseDTO(saved);
    }

    @Transactional
    // Confirms payment for a completed booking and notifies user
    public BookingResponseDTO confirmPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Only COMPLETED bookings can have payment confirmed");
        }

        // Send notification to user
        notificationService.notifyPaymentConfirmed(
                booking.getUser().getId(),
                booking.getId(),
                100.0 // Placeholder amount
        );
        
        return mapToBookingResponseDTO(booking);
    }

    // Maps Booking entity to API response DTO
    private BookingResponseDTO mapToBookingResponseDTO(Booking booking) {
        UserResponseDTO userDTO = new UserResponseDTO();
        userDTO.setId(booking.getUser().getId());
        userDTO.setName(booking.getUser().getName());
        userDTO.setEmail(booking.getUser().getEmail());
        userDTO.setRole(booking.getUser().getRole());
        userDTO.setCity(booking.getUser().getCity());
        userDTO.setPhone(booking.getUser().getPhone());

        UserResponseDTO providerDTO = new UserResponseDTO();
        providerDTO.setId(booking.getProvider().getId());
        providerDTO.setName(booking.getProvider().getName());
        providerDTO.setEmail(booking.getProvider().getEmail());
        providerDTO.setRole(booking.getProvider().getRole());
        providerDTO.setCity(booking.getProvider().getCity());
        providerDTO.setPhone(booking.getProvider().getPhone());

        return new BookingResponseDTO(
                booking.getId(),
                userDTO,
                providerDTO,
                booking.getServiceType(),
                booking.getStatus(),
                booking.getNote(),
                booking.getCreatedAt(),
                booking.getAcceptedAt(),
                booking.getCompletedAt(),
                booking.getBookingDate() != null ? booking.getBookingDate().toString() : null,
                booking.getPreferredTime(),
                booking.getStartJobOtp(),
                booking.getArrivedAt() != null ? booking.getArrivedAt().toString() : null,
                booking.getStartedAt() != null ? booking.getStartedAt().toString() : null
        );
    }
}
