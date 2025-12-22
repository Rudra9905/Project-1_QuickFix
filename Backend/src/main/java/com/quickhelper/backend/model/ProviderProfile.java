package com.quickhelper.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.quickhelper.backend.model.ProfileStatus;

import java.util.ArrayList;
import java.util.List;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_status", nullable = false)
    private ProfileStatus profileStatus = ProfileStatus.INCOMPLETE; // Lifecycle status

    @Column(name = "experience_years")
    private Integer experienceYears; // Experience in years

    @Column(name = "resume_url")
    private String resumeUrl; // Stored resume location or URL

    @Column(name = "demo_video_url")
    private String demoVideoUrl; // Stored demo video location or URL

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

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false; // Derived approval flag (kept for backward compatibility)

    @Column(name = "rejection_reason")
    private String rejectionReason;
    
    @Column(name = "display_name")
    private String displayName; // Provider's display/business name
    
    @Column(name = "profile_photo_url")
    private String profilePhotoUrl; // Profile photo URL
    
    @Column(name = "tagline")
    private String tagline; // Professional tagline

    @ElementCollection
    @CollectionTable(name = "provider_portfolio_images", joinColumns = @JoinColumn(name = "provider_profile_id"))
    @Column(name = "image_url")
    private List<String> portfolioImages = new ArrayList<>(); // Optional rejection explanation
}
