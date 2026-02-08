package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.NotificationType;
import com.quickhelper.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationEvent implements Serializable {
    private Long userId;
    private UserRole userRole;
    private NotificationType type;
    private String title;
    private String message;
    private boolean isRead;
    private boolean isHighPriority;
    private Long referenceId;
}
