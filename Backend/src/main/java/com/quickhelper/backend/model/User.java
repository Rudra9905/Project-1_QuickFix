package com.quickhelper.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
// Core user record representing both customers and providers
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Display name

    @Column(unique = true, nullable = false)
    private String email; // Unique login identifier

    private String password; // Hashed password

    private String phone; // Optional contact number

    private String city; // Optional city preference

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // USER or PROVIDER

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // Auto-set on insert

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // Auto-updated on change
}