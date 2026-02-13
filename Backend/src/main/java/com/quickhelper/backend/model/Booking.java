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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Customer who created the booking

    @ManyToOne(fetch = FetchType.LAZY)
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

    @Column(name = "start_job_otp")
    private String startJobOtp; // OTP to verify job start

    @Column(name = "booking_date")
    private java.time.LocalDate bookingDate;

    @Column(name = "preferred_time")
    private String preferredTime;

    @CreationTimestamp
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Created timestamp

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt; // When provider accepted

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt; // When provider reached location

    @Column(name = "started_at")
    private LocalDateTime startedAt; // When provider physically started the job (OTP verified)

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // When job finished

    @Column(name = "payment_intent_id")
    private String paymentIntentId; // Stripe Payment Intent ID for refunds
}
