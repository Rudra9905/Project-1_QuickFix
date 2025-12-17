package com.quickhelper.backend.dto;

import com.quickhelper.backend.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
// Request body for registering a new user (USER or PROVIDER)
public class RegisterRequestDTO {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String phone;

    private String city;

    @NotNull(message = "Role is required")
    private UserRole role;
}