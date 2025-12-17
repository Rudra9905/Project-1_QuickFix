package com.quickhelper.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "provider_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
// Additional profile data for provider accounts
public class ProviderProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user; // Owning user (provider)

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType; // Offered service category

    @Column(columnDefinition = "TEXT")
    private String description; // Optional service description

    @Column(name = "base_price")
    private Integer basePrice; // Optional base price

    @Column(nullable = false)
    private Double rating = 0.0; // Aggregated average rating

    @Column(name = "location_lat")
    private Double locationLat; // Latitude coordinate

    @Column(name = "location_lng")
    private Double locationLng; // Longitude coordinate

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true; // Availability toggle
}
