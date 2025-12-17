package com.quickhelper.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
// Booking linking a user request to a provider
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Customer who created the booking

    @ManyToOne
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider; // Provider assigned to fulfill the booking

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType; // Category of requested service

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.REQUESTED; // Workflow state

    @Column(columnDefinition = "TEXT")
    private String note; // Optional customer note

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Created timestamp

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt; // When provider accepted

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // When job finished
}
