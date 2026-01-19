package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Fetch conversation between two users
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1) ORDER BY m.timestamp DESC")
    Page<ChatMessage> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2, Pageable pageable);

    // Count unread messages for a recipient from a specific sender
    Long countByReceiverIdAndSenderIdAndIsReadFalse(Long receiverId, Long senderId);
    
    // Find unread messages for a recipient from a specific sender
    List<ChatMessage> findByReceiverIdAndSenderIdAndIsReadFalse(Long receiverId, Long senderId);
    
    // Count total unread messages for a user
    Long countByReceiverIdAndIsReadFalse(Long receiverId);

    // Find distinct conversation partners for a user (simplified approach)
    @Query("SELECT DISTINCT m.senderId FROM ChatMessage m WHERE m.receiverId = :userId")
    List<Long> findSendersByReceiverId(@Param("userId") Long userId);
    
    // Find chat messages by booking ID (to support persistence until job completion)
    List<ChatMessage> findByBookingId(Long bookingId);
    
    // Find chat messages by booking ID and sender/receiver (for job-specific conversations)
    @Query("SELECT m FROM ChatMessage m WHERE m.bookingId = :bookingId AND ((m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1)) ORDER BY m.timestamp ASC")
    List<ChatMessage> findByBookingIdAndParticipants(@Param("bookingId") Long bookingId, @Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
