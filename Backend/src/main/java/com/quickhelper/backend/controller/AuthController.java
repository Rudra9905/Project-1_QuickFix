package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.AuthResponseDTO;
import com.quickhelper.backend.dto.LoginRequestDTO;
import com.quickhelper.backend.dto.RegisterRequestDTO;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.UserRole;
import com.quickhelper.backend.service.UserService;
import com.quickhelper.backend.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
// Authentication endpoints for registration and login with JWT issuance
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    // Registers a new user and issues a JWT
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setPhone(request.getPhone());
        user.setCity(request.getCity());
        user.setRole(request.getRole());

        User savedUser = userService.registerUser(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getRole().toString());

        AuthResponseDTO response = new AuthResponseDTO(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getCity(),
                token
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    // Authenticates an existing user and returns JWT plus basic profile info
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        User user = userService.authenticateUser(request.getEmail(), request.getPassword());

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getRole().toString());

        AuthResponseDTO response = new AuthResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCity(),
                token
        );
        return ResponseEntity.ok(response);
    }
}