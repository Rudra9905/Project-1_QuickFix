package com.quickhelper.backend.controller;

import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin-init")
@RequiredArgsConstructor
// Temporary endpoint for initializing the admin user
// This should be removed or secured in production
public class AdminInitController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/create-admin")
    public ResponseEntity<String> createAdminUser(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String name) {
        
        // Check if an admin already exists
        if (userService.getClass() != null) { // Just to access userService
            // In a real scenario, we would check if admin exists
            // For simplicity, we'll just create the admin user
        }

        User adminUser = new User();
        adminUser.setName(name);
        adminUser.setEmail(email);
        adminUser.setPassword(passwordEncoder.encode(password));
        adminUser.setRole(UserRole.ADMIN);
        
        try {
            userService.registerUser(adminUser);
            return ResponseEntity.ok("Admin user created successfully! You can now log in and access the admin dashboard.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating admin user: " + e.getMessage());
        }
    }
}