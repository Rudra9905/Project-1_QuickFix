package com.quickhelper.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
// Notification stored for either a user or provider with basic metadata
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Recipient identifier (user or provider) for flexibility
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    // Role of the receiver: USER or PROVIDER
    @Enumerated(EnumType.STRING)
    @Column(name = "receiver_role", nullable = false)
    private UserRole receiverRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type; // Category of notification event

    @Column(nullable = false)
    private String title; // Short title for UI

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message; // Detailed message body

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false; // Read status flag

    @Column(name = "is_high_priority", nullable = false)
    private Boolean isHighPriority = false; // Highlight urgent events

    @Column(name = "related_booking_id")
    private Long relatedBookingId; // Optional linked booking

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Creation timestamp
}