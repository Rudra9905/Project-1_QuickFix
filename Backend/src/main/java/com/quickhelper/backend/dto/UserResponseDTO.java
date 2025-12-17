package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Lightweight user projection returned by APIs
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String city;
    
    public UserResponseDTO(Long id, String name, String email, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }
}