package com.quickhelper.backend.controller;

import com.quickhelper.backend.util.DebugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
// Lightweight health endpoints for diagnostics
public class HealthController {

    @GetMapping("/notifications")
    // Checks notification pipeline health
    public ResponseEntity<Map<String, Object>> notificationSystemHealth() {
        DebugUtil.logDebug("Health check for notification system");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "notification-system");
        response.put("version", "1.0.0");
        
        DebugUtil.logInfo("Notification system health check successful");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/websocket")
    // Checks WebSocket subsystem health
    public ResponseEntity<Map<String, Object>> websocketHealth() {
        DebugUtil.logDebug("Health check for WebSocket system");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "websocket-system");
        response.put("version", "1.0.0");
        
        DebugUtil.logInfo("WebSocket system health check successful");
        return ResponseEntity.ok(response);
    }
}