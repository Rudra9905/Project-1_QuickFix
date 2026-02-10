package com.quickhelper.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Fallback controller that catches requests to /auth/** (without the /api prefix)
 * and returns a helpful error instead of the confusing "No static resource auth/login" message.
 * This prevents Spring Boot's static resource handler from catching these requests.
 */
@RestController
@RequestMapping("/auth")
public class AuthFallbackController {

    @RequestMapping(value = "/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<Map<String, String>> handleFallback(HttpServletRequest request) {
        String originalPath = request.getRequestURI();
        String correctedPath = "/api" + originalPath;
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "Invalid endpoint path",
                        "message", "Auth endpoints require the /api prefix. Use " + correctedPath + " instead of " + originalPath,
                        "correctPath", correctedPath
                ));
    }
}
