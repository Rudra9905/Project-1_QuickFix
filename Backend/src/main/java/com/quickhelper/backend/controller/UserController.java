package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.UserResponseDTO;
import com.quickhelper.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
// User lookup endpoints for current user and directory
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    // Returns the profile of the authenticated user (by id param)
    public ResponseEntity<UserResponseDTO> getCurrentUser(@RequestParam Long userId) {
        UserResponseDTO user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    // Returns a user profile by id
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    // Lists all users in the system
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/city")
    // Updates a user's city
    public ResponseEntity<UserResponseDTO> updateUserCity(@PathVariable Long id, @RequestBody(required = false) String city) {
        UserResponseDTO user = userService.updateUserCity(id, city);
        return ResponseEntity.ok(user);
    }
}