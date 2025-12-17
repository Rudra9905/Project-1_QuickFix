package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// Response payload returned after successful authentication
public class AuthResponseDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String city;
    private String token; // Issued JWT token
}
