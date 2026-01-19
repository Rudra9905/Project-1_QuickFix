package com.quickhelper.backend.service;

import com.quickhelper.backend.model.ChatMessage;
import com.quickhelper.backend.repository.ChatMessageRepository;
import com.quickhelper.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final NotificationService notificationService; // Reuse for websocket sending if needed, or use template directly
    private final BookingService bookingService; // To check booking status for persistence

    @Transactional
    public ChatMessage saveMessage(ChatMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        message.setIsRead(false);
        return chatMessageRepository.save(message);
    }

    public Page<ChatMessage> getConversation(Long userId1, Long userId2, Pageable pageable) {
        return chatMessageRepository.findConversation(userId1, userId2, pageable);
    }

    @Transactional
    public void markConversationAsRead(Long receiverId, Long senderId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findByReceiverIdAndSenderIdAndIsReadFalse(receiverId, senderId);
        unreadMessages.forEach(message -> message.setIsRead(true));
        chatMessageRepository.saveAll(unreadMessages);
    }
    
    // Method to check if a booking is still active (not completed/cancelled)
    public boolean isBookingActive(Long bookingId) {
        // Integrate with BookingService to check actual status
        if (bookingId == null) {
            // If no bookingId is associated, consider the chat as persistent
            return true;
        }
        
        try {
            // Check if booking exists and is in active status
            // Active statuses: REQUESTED, ACCEPTED, IN_PROGRESS
            // Completed statuses: CANCELLED, COMPLETED
            return bookingService.isActiveBooking(bookingId);
        } catch (Exception e) {
            // If there's an error checking booking status, assume it's active to be safe
            System.err.println("Error checking booking status for chat persistence: " + e.getMessage());
            return true;
        }
    }
    
    // Get chat messages for a specific booking
    public List<ChatMessage> getChatMessagesByBooking(Long bookingId) {
        return chatMessageRepository.findByBookingId(bookingId);
    }
    
    // Get chat messages for a booking between specific participants
    public List<ChatMessage> getChatMessagesForBookingParticipants(Long bookingId, Long userId1, Long userId2) {
        return chatMessageRepository.findByBookingIdAndParticipants(bookingId, userId1, userId2);
    }
    
    public Long getUnreadCount(Long userId) {
        return chatMessageRepository.countByReceiverIdAndIsReadFalse(userId);
    }
}
