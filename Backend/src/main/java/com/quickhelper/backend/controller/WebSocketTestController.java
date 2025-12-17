package com.quickhelper.backend.controller;

import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
// Simple endpoint to trigger a test notification over WebSocket
public class WebSocketTestController {
    private final NotificationService notificationService;

    @PostMapping("/notify/{userId}")
    // Sends a test notification to a user to verify WebSocket delivery
    public ResponseEntity<String> sendTestNotification(@PathVariable Long userId) {
        try {
            notificationService.createAndSendNotification(
                    userId,
                    UserRole.USER, // Default to USER role for testing
                    com.quickhelper.backend.model.NotificationType.BOOKING_REQUEST_SENT,
                    "Test Notification",
                    "This is a test notification to verify WebSocket connection",
                    false,
                    null
            );
            return ResponseEntity.ok("Test notification sent to user " + userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}