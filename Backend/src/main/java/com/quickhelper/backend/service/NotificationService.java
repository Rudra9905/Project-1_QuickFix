package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.NotificationDTO;
import com.quickhelper.backend.model.*;
import com.quickhelper.backend.repository.NotificationRepository;
import com.quickhelper.backend.repository.UserRepository;
import com.quickhelper.backend.util.DebugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Creates, stores, and dispatches notifications via WebSocket and database
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    // Creates a notification record and sends it via WebSocket
    public NotificationDTO createAndSendNotification(
            Long receiverId,
            UserRole receiverRole,
            NotificationType type,
            String title,
            String message,
            Boolean isHighPriority,
            Long relatedBookingId) {
        
        try {
            DebugUtil.logDebug("Creating notification for receiverId: {}, role: {}, type: {}", receiverId, receiverRole, type);
            
            // Validate that the user/provider exists
            User user = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("User/Provider not found with id: " + receiverId));

            Notification notification = new Notification();
            notification.setReceiverId(receiverId);
            notification.setReceiverRole(receiverRole);
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setIsHighPriority(isHighPriority != null ? isHighPriority : false);
            notification.setRelatedBookingId(relatedBookingId);
            notification.setIsRead(false);

            Notification saved = notificationRepository.save(notification);
            NotificationDTO dto = mapToDTO(saved);

            // Send real-time notification via WebSocket immediately
            sendWebSocketNotification(receiverId, receiverRole, dto);

            return dto;
        } catch (Exception e) {
            DebugUtil.logError("Error creating notification: " + e.getMessage(), e);
            throw e;
        }
    }

    // Fetches all notifications for a receiver in reverse chronological order
    public List<NotificationDTO> getNotifications(Long receiverId, UserRole receiverRole) {
        return DebugUtil.measureExecutionTime(() -> 
            notificationRepository.findByReceiverIdAndReceiverRoleOrderByCreatedAtDesc(receiverId, receiverRole)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()),
            "getNotifications"
        );
    }

    // Fetches unread notifications for a receiver
    public List<NotificationDTO> getUnreadNotifications(Long receiverId, UserRole receiverRole) {
        return DebugUtil.measureExecutionTime(() -> 
            notificationRepository.findByReceiverIdAndReceiverRoleAndIsReadFalseOrderByCreatedAtDesc(receiverId, receiverRole)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()),
            "getUnreadNotifications"
        );
    }

    // Returns unread notification count for a receiver
    public Long getUnreadCount(Long receiverId, UserRole receiverRole) {
        return DebugUtil.measureExecutionTime(() -> 
            notificationRepository.countByReceiverIdAndReceiverRoleAndIsReadFalse(receiverId, receiverRole),
            "getUnreadCount"
        );
    }

    @Transactional
    // Marks a single notification as read
    public NotificationDTO markAsRead(Long notificationId) {
        return DebugUtil.measureExecutionTime(() -> {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));
            notification.setIsRead(true);
            Notification updated = notificationRepository.save(notification);
            return mapToDTO(updated);
        }, "markAsRead");
    }

    @Transactional
    // Marks all notifications as read for a receiver
    public void markAllAsRead(Long receiverId, UserRole receiverRole) {
        DebugUtil.measureExecutionTime(() -> {
            List<Notification> unread = notificationRepository.findByReceiverIdAndReceiverRoleAndIsReadFalseOrderByCreatedAtDesc(receiverId, receiverRole);
            unread.forEach(n -> n.setIsRead(true));
            notificationRepository.saveAll(unread);
            return null; // Void methods need to return null in Supplier
        }, "markAllAsRead");
    }

    @Transactional
    // Deletes a notification by id
    public void deleteNotification(Long notificationId) {
        DebugUtil.measureExecutionTime(() -> {
            notificationRepository.deleteById(notificationId);
            return null; // Void methods need to return null in Supplier
        }, "deleteNotification");
    }

    // Helper methods for creating notifications based on booking events for USERS
    public void notifyBookingRequestSent(Long userId, Long providerId, Long bookingId, String serviceType) {
        // Notify provider about new booking request
        createAndSendNotification(
                providerId,
                UserRole.PROVIDER,
                NotificationType.NEW_BOOKING_REQUEST,
                "New Booking Request",
                "You have received a new " + serviceType + " service request",
                true, // High priority
                bookingId
        );
    }

    public void notifyBookingAccepted(Long userId, Long bookingId, String providerName) {
        // Notify user that booking was accepted
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.BOOKING_ACCEPTED,
                "Booking Accepted",
                providerName + " has accepted your booking request",
                false,
                bookingId
        );
    }

    public void notifyBookingRejected(Long userId, Long bookingId, String providerName) {
        // Notify user that booking was rejected
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                providerName + " has rejected your booking request",
                true, // High priority
                bookingId
        );
    }

    public void notifyBookingCancelled(Long providerId, Long bookingId, String userName) {
        // Notify provider that booking was cancelled
        createAndSendNotification(
                providerId,
                UserRole.PROVIDER,
                NotificationType.BOOKING_CANCELLED,
                "Booking Cancelled",
                userName + " has cancelled the booking",
                true, // High priority
                bookingId
        );
    }

    public void notifyProviderOnWay(Long userId, Long bookingId, String providerName) {
        // Notify user that provider is on the way
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.PROVIDER_ON_WAY,
                "Provider On The Way",
                providerName + " is on the way to your location",
                false,
                bookingId
        );
    }

    public void notifyServiceStarted(Long userId, Long bookingId, String providerName) {
        // Notify user that service has started
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.SERVICE_STARTED,
                "Service Started",
                providerName + " has started the service",
                false,
                bookingId
        );
    }

    public void notifyServiceCompleted(Long userId, Long providerId, Long bookingId, String userName) {
        // Notify user
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.SERVICE_COMPLETED,
                "Service Completed",
                "Your service has been completed. Please rate your experience.",
                false,
                bookingId
        );

        // Notify provider
        createAndSendNotification(
                providerId,
                UserRole.PROVIDER,
                NotificationType.JOB_COMPLETED,
                "Job Completed",
                "You have completed the service for " + userName,
                false,
                bookingId
        );
    }

    public void notifyPaymentConfirmed(Long userId, Long bookingId, Double amount) {
        // Notify user that payment was confirmed
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.PAYMENT_CONFIRMED,
                "Payment Confirmed",
                "Payment of ₹" + amount + " has been confirmed",
                false,
                bookingId
        );
    }

    public void notifyEarningsCredited(Long providerId, Long bookingId, Double amount) {
        // Notify provider that earnings were credited
        createAndSendNotification(
                providerId,
                UserRole.PROVIDER,
                NotificationType.EARNINGS_CREDITED,
                "Earnings Credited",
                "₹" + amount + " has been credited to your account",
                false,
                bookingId
        );
    }

    // Additional helper methods for other events
    public void notifyRatingReminder(Long userId, Long bookingId) {
        // Notify user to rate their experience
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.RATING_REMINDER,
                "Rate Your Experience",
                "Please rate and review your recent service",
                false,
                bookingId
        );
    }

    public void notifyLiveLocationStarted(Long userId, Long bookingId) {
        // Notify user that live location tracking has started
        createAndSendNotification(
                userId,
                UserRole.USER,
                NotificationType.LIVE_LOCATION_STARTED,
                "Live Location Tracking",
                "You can now track your provider's live location",
                false,
                bookingId
        );
    }

    @Async
    // Sends notification over WebSocket to the role-specific topic
    public void sendWebSocketNotification(Long receiverId, UserRole receiverRole, NotificationDTO dto) {
        try {
            // Updated destination to support both USER and PROVIDER roles
            String destination = "/topic/" + receiverRole.toString().toLowerCase() + "/" + receiverId + "/notifications";
            DebugUtil.logDebug("Sending notification to destination: {}", destination);
            DebugUtil.logDebug("Notification details - ID: {}, Title: {}, Type: {}", dto.getId(), dto.getTitle(), dto.getType());
            
            messagingTemplate.convertAndSend(destination, dto);
            DebugUtil.logInfo("✓ Notification sent successfully via WebSocket to {}: {}", destination, dto.getTitle());
        } catch (Exception e) {
            DebugUtil.logError("✗ ERROR sending notification via WebSocket: {}", e.getMessage(), e);
            
            // Fallback: Store notification in database with failed delivery flag
            try {
                storeFailedNotification(receiverId, receiverRole, dto);
            } catch (Exception fallbackException) {
                DebugUtil.logError("✗ Failed to store notification after WebSocket failure: {}", fallbackException.getMessage(), fallbackException);
            }
        }
    }

    // Persists notification if WebSocket delivery fails
    private void storeFailedNotification(Long receiverId, UserRole receiverRole, NotificationDTO dto) {
        DebugUtil.logWarn("Storing failed notification for later delivery");
        
        Notification notification = new Notification();
        notification.setReceiverId(receiverId);
        notification.setReceiverRole(receiverRole);
        notification.setType(dto.getType());
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notification.setIsRead(false);
        notification.setIsHighPriority(dto.getIsHighPriority());
        notification.setRelatedBookingId(dto.getRelatedBookingId());
        
        notificationRepository.save(notification);
        DebugUtil.logInfo("Stored failed notification with ID: {}", notification.getId());
    }

    // Maps Notification entity to DTO
    private NotificationDTO mapToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getReceiverId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead(),
                notification.getIsHighPriority(),
                notification.getRelatedBookingId(),
                notification.getCreatedAt()
        );
    }
}