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
import com.quickhelper.backend.dto.NotificationEvent;
import com.quickhelper.backend.model.NotificationType;
import com.quickhelper.backend.repository.BookingRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

import jakarta.annotation.PreDestroy;

@Service
@RequiredArgsConstructor
// Handles booking lifecycle transitions and notification side-effects
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final com.quickhelper.backend.repository.ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final NotificationProducer notificationProducer;
    private final StripeService stripeService;
    private final org.springframework.cache.CacheManager cacheManager;
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    
    // Shutdown the scheduler when the application stops
    @jakarta.annotation.PreDestroy
    public void destroy() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }


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
        booking.setPaymentIntentId(request.getPaymentIntentId());

        // Generate 6-digit OTP
        int otpValue = 100000 + new java.util.Random().nextInt(900000);
        booking.setStartJobOtp(String.valueOf(otpValue));

        Booking saved = bookingRepository.save(booking);
        
        // Evict caches for both user and provider
        utils_evictBookingCaches(saved);
        
        // Schedule auto-rejection for single bookings (not multiple booking packages)
        boolean isPackage = "Multiple Booking Package".equals(request.getNote());
        if (!isPackage) {
            scheduleBookingAutoRejection(saved.getId());
        }
        
        try {
            // Send notification to provider
            System.out.println("Sending notification to provider: " + provider.getId());
            notificationProducer.sendNotification(new NotificationEvent(
                    provider.getId(),
                    UserRole.PROVIDER,
                    NotificationType.NEW_BOOKING_REQUEST,
                    "New Booking Request",
                    "You have received a new " + request.getServiceType().toString() + " service request",
                    false, // isRead
                    true,  // isHighPriority
                    saved.getId()
            ));
            System.out.println("Provider notification sent successfully");
        } catch (Exception e) {
            System.err.println("Error sending provider notification: " + e.getMessage());
            e.printStackTrace();
            // Continue even if notification fails
        }
        
        try {
            // Send notification to user
            System.out.println("Sending notification to user: " + user.getId());
            notificationProducer.sendNotification(new NotificationEvent(
                    user.getId(),
                    UserRole.USER,
                    NotificationType.BOOKING_REQUEST_SENT,
                    "Booking Request Sent",
                    "Your booking request has been sent to " + provider.getName(),
                    false, // isRead
                    false, // isHighPriority
                    saved.getId()
            ));
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
                Booking saved = bookingRepository.save(booking);
                utils_evictBookingCaches(saved);

                // Process Refund if applicable
                processRefund(booking);
                
                // Notify user
                // Notify user
                notificationProducer.sendNotification(new NotificationEvent(
                    booking.getUser().getId(),
                    UserRole.USER,
                    NotificationType.BOOKING_REJECTED,
                    "Booking Rejected",
                    booking.getProvider().getName() + " has rejected your booking request",
                    false,
                    true,
                    booking.getId()
                ));
            }
        });
    }

    @org.springframework.cache.annotation.Cacheable(value = "user_bookings", key = "#userId")
    public List<BookingResponseDTO> getBookingsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        List<Booking> bookings = bookingRepository.findByUser(user);

        if (bookings.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Batch fetch reviews to avoid N+1 problem
        List<com.quickhelper.backend.model.Review> reviews = reviewRepository.findByBookingIn(bookings);
        Map<Long, com.quickhelper.backend.model.Review> reviewMap = reviews.stream()
                .collect(Collectors.toMap(r -> r.getBooking().getId(), Function.identity(), (existing, replacement) -> existing));

        return bookings.stream()
                .map(b -> mapToBookingResponseDTO(b, reviewMap.get(b.getId())))
                .collect(Collectors.toList());
    }

    @org.springframework.cache.annotation.Cacheable(value = "provider_bookings", key = "#providerId")
    public List<BookingResponseDTO> getBookingsByProvider(Long providerId) {
        User provider = userRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + providerId));
        List<Booking> bookings = bookingRepository.findByProvider(provider);

        if (bookings.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Batch fetch reviews to avoid N+1 problem
        List<com.quickhelper.backend.model.Review> reviews = reviewRepository.findByBookingIn(bookings);
        Map<Long, com.quickhelper.backend.model.Review> reviewMap = reviews.stream()
                .collect(Collectors.toMap(r -> r.getBooking().getId(), Function.identity(), (existing, replacement) -> existing));

        return bookings.stream()
                .map(b -> mapToBookingResponseDTO(b, reviewMap.get(b.getId())))
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
        utils_evictBookingCaches(updated);
        
        // Send notifications
        // Send notifications
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.BOOKING_ACCEPTED,
                "Booking Accepted",
                booking.getProvider().getName() + " has accepted your booking request",
                false,
                false,
                updated.getId()
        ));
        
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getProvider().getId(),
                UserRole.PROVIDER,
                NotificationType.JOB_ACCEPTED,
                "Job Accepted",
                "You have accepted the booking request from " + booking.getUser().getName(),
                false,
                false,
                updated.getId()
        ));
        
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
        utils_evictBookingCaches(updated);
        
        // Send notification to user
        // Send notification to user
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                booking.getProvider().getName() + " has rejected your booking request",
                false,
                true,
                updated.getId()
        ));

        // Process Refund
        processRefund(booking);
        
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
        utils_evictBookingCaches(updated);
        
        // Send notification to provider if cancelled by user
        if (booking.getUser().getRole() == com.quickhelper.backend.model.UserRole.USER) {
            notificationProducer.sendNotification(new NotificationEvent(
                    booking.getProvider().getId(),
                    UserRole.PROVIDER,
                    NotificationType.BOOKING_CANCELLED,
                    "Booking Cancelled",
                    booking.getUser().getName() + " has cancelled the booking",
                    false,
                    true,
                    updated.getId()
            ));
        }

        // Refund Logic
        processRefund(booking);
        
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
        utils_evictBookingCaches(updated);
        
        // Send notifications
        // Send notifications
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.SERVICE_COMPLETED,
                "Service Completed",
                "Your service has been completed. Please rate your experience.",
                false,
                false,
                updated.getId()
        ));
        
        // Notify provider about earnings
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getProvider().getId(),
                UserRole.PROVIDER,
                NotificationType.JOB_COMPLETED, // Using JOB_COMPLETED for earnings info as placeholder or separate EARNINGS type
                "Earnings Credited",
                "₹" + 100.0 + " has been credited to your account",
                false,
                false,
                updated.getId()
        ));

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
        // Send notification to user
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.PROVIDER_ON_WAY,
                "Provider On The Way",
                booking.getProvider().getName() + " is on the way to your location",
                false,
                false,
                booking.getId()
        ));
        
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
        utils_evictBookingCaches(saved);
        
        // Notify user
        // Notify user
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.PROVIDER_ARRIVED,
                "Provider Arrived",
                booking.getProvider().getName() + " has arrived at your location",
                false,
                false,
                booking.getId()
        )); // Re-using this notification or creating a new specific one ideally

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

        // Verify OTP
        if (booking.getStartJobOtp() == null || !booking.getStartJobOtp().equals(otp)) {
            throw new BadRequestException("Invalid Start Job OTP");
        }

        // Date validation removed to allow flexible start times

        // Set startedAt timestamp
        booking.setStartedAt(LocalDateTime.now());
        // Ensure status is IN_PROGRESS (if not already)
        booking.setStatus(BookingStatus.IN_PROGRESS);
        
        Booking saved = bookingRepository.save(booking);
        utils_evictBookingCaches(saved);

        // Send notification
        // Send notification
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.SERVICE_STARTED,
                "Service Started",
                booking.getProvider().getName() + " has started the service",
                false,
                false,
                booking.getId()
        ));
        
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
        // Send notification to user
        notificationProducer.sendNotification(new NotificationEvent(
                booking.getUser().getId(),
                UserRole.USER,
                NotificationType.PAYMENT_CONFIRMED,
                "Payment Confirmed",
                "Payment of ₹" + 100.0 + " has been confirmed",
                false,
                false,
                booking.getId()
        ));
        
        return mapToBookingResponseDTO(booking);
    }

    // Maps Booking entity to API response DTO - loads review from DB
    private BookingResponseDTO mapToBookingResponseDTO(Booking booking) {
        com.quickhelper.backend.model.Review review = reviewRepository.findByBooking(booking).orElse(null);
        return mapToBookingResponseDTO(booking, review);
    }

    // Maps Booking entity to API response DTO - uses provided review (can be null)
    private BookingResponseDTO mapToBookingResponseDTO(Booking booking, com.quickhelper.backend.model.Review review) {
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

        providerDTO.setPhone(booking.getProvider().getPhone());

        Long reviewId = (review != null) ? review.getId() : null;

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
                booking.getStartedAt() != null ? booking.getStartedAt().toString() : null,
                reviewId,
                reviewId != null
        );
    }

    private void processRefund(Booking booking) {
        if (booking.getPaymentIntentId() != null && !booking.getPaymentIntentId().isEmpty()) {
            try {
                System.out.println("Initiating refund for booking: " + booking.getId() + ", paymentIntent: " + booking.getPaymentIntentId());
                stripeService.refundPayment(booking.getPaymentIntentId());
                System.out.println("Refund successful");

                // Notify user about refund
                // Notify user about refund
                notificationProducer.sendNotification(new NotificationEvent(
                        booking.getUser().getId(),
                        UserRole.USER,
                        NotificationType.REFUND_PROCESSED,
                        "Refund Initiated",
                        "A refund has been initiated for your booking.",
                        false,
                        false,
                        booking.getId()
                ));
            } catch (Exception e) {
                System.err.println("Error processing refund: " + e.getMessage());
                e.printStackTrace();
                // Don't fail the rejection/cancellation, but log error
            }
        }
    }
    // Schedule auto-rejection for a booking
    public void scheduleBookingAutoRejection(Long bookingId) {
        // Schedule the rejection to occur in 5 minutes
        scheduler.schedule(() -> {
            try {
                checkAndRejectBooking(bookingId);
                System.out.println("Auto-rejected booking: " + bookingId + " after 5 minutes");
            } catch (Exception e) {
                System.err.println("Failed to auto-reject booking " + bookingId + ": " + e.getMessage());
            }
        }, 5, TimeUnit.MINUTES);
    }
    
    // Cron job to auto-reject expired bookings every 5 minutes (reduced frequency)
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void scanAndRejectExpiredBookings() {
        try {
            System.out.println("[AUTO-REJECT] Running scheduled job at: " + LocalDateTime.now());
            
            // Calculate cutoff time: 5 minutes ago
            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);
            
            // Find all bookings that are REQUESTED and created before cutoff time (expired)
            List<Booking> expiredBookings = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.REQUESTED, cutoffTime);

            System.out.println("[AUTO-REJECT] Found " + expiredBookings.size() + " expired bookings to reject");
            
            if (!expiredBookings.isEmpty()) {
                System.out.println("[AUTO-REJECT] Auto-rejecting " + expiredBookings.size() + " bookings...");
                for (Booking booking : expiredBookings) {
                    try {
                        System.out.println("[AUTO-REJECT] Rejecting booking ID: " + booking.getId());
                        checkAndRejectBooking(booking.getId());
                        System.out.println("[AUTO-REJECT] Successfully auto-rejected booking: " + booking.getId());
                    } catch (Exception e) {
                        System.err.println("[AUTO-REJECT] Failed to auto-reject booking " + booking.getId() + ": " + e.getMessage());
                    }
                }
            } else {
                System.out.println("[AUTO-REJECT] No expired bookings found");
            }
        } catch (Exception e) {
            System.err.println("[AUTO-REJECT] Error in scheduled job: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Check if a booking is still active (not completed/cancelled)
    @Transactional(readOnly = true)
    public boolean isActiveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        
        // Active statuses: REQUESTED, ACCEPTED, IN_PROGRESS
        // Inactive statuses: CANCELLED, COMPLETED
        return booking.getStatus() == BookingStatus.REQUESTED || 
               booking.getStatus() == BookingStatus.ACCEPTED || 
               booking.getStatus() == BookingStatus.IN_PROGRESS;
    }
    
    // Helper to evict caches for both user and provider involved in a booking
    private void utils_evictBookingCaches(Booking booking) {
        if (booking != null) {
            try {
                if (booking.getUser() != null) {
                    cacheManager.getCache("user_bookings").evict(booking.getUser().getId());
                }
                if (booking.getProvider() != null) {
                    cacheManager.getCache("provider_bookings").evict(booking.getProvider().getId());
                }
            } catch (Exception e) {
                System.err.println("Cache eviction failed: " + e.getMessage());
            }
        }
    }
}
