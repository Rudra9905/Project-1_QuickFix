package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.NotificationDTO;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
// CRUD endpoints for user/provider notifications and unread counts
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/{role}/{receiverId}")
    // Lists all notifications for a receiver (user or provider)
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @PathVariable String role,
            @PathVariable Long receiverId) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        List<NotificationDTO> notifications = notificationService.getNotifications(receiverId, userRole);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/{role}/{receiverId}/unread")
    // Lists unread notifications for a receiver
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @PathVariable String role,
            @PathVariable Long receiverId) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(receiverId, userRole);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/{role}/{receiverId}/unread-count")
    // Returns unread notification count for a receiver
    public ResponseEntity<Long> getUnreadCount(
            @PathVariable String role,
            @PathVariable Long receiverId) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        Long count = notificationService.getUnreadCount(receiverId, userRole);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/{notificationId}/read")
    // Marks a single notification as read
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long notificationId) {
        NotificationDTO notification = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/{role}/{receiverId}/read-all")
    // Marks all notifications as read for a receiver
    public ResponseEntity<Void> markAllAsRead(
            @PathVariable String role,
            @PathVariable Long receiverId) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        notificationService.markAllAsRead(receiverId, userRole);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{notificationId}")
    // Deletes a notification by id
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok().build();
    }
}