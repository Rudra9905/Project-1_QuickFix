package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Transfer object for notifications sent to clients and WebSocket
public class NotificationDTO {
    private Long id;
    private Long receiverId;
    private NotificationType type;
    private String title;
    private String message;
    private Boolean isRead;
    private Boolean isHighPriority;
    private Long relatedBookingId;
    private LocalDateTime createdAt;
}