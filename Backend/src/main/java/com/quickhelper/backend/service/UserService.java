package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.UserResponseDTO;
import com.quickhelper.backend.exception.DuplicateResourceException;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// User registration, authentication, and lookups
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    // Creates a new user with unique email and hashed password
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException("User with email " + user.getEmail() + " already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Validates credentials and returns the authenticated user
    public User authenticateUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }
        
        return user;
    }

    // Retrieves a user by id or throws if missing
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    // Returns all users mapped to DTOs
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponseDTO)
                .collect(Collectors.toList());
    }

    // Returns a single user mapped to DTO
    public UserResponseDTO getUserById(Long id) {
        User user = findById(id);
        return mapToUserResponseDTO(user);
    }

    // Updates a user's city
    @Transactional
    public UserResponseDTO updateUserCity(Long id, String city) {
        User user = findById(id);
        user.setCity(city);
        User updatedUser = userRepository.save(user);
        return mapToUserResponseDTO(updatedUser);
    }

    // Maps User entity to API response DTO
    private UserResponseDTO mapToUserResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCity(user.getCity());
        return dto;
    }
}