package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.BookingStatus;
import com.quickhelper.backend.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Booking details returned to clients
public class BookingResponseDTO {
    private Long id;
    private UserResponseDTO user;
    private UserResponseDTO provider;
    private ServiceType serviceType;
    private BookingStatus status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
    private String bookingDate;
    private String preferredTime;
    private String startJobOtp;
    private String arrivedAt;
    private String startedAt;
    private Long reviewId;
    private boolean hasReview;
}
