package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.User;
import com.quickhelper.backend.model.ProfileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// JPA repository for provider profiles with city/service availability lookups
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    @Query("SELECT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages WHERE p.user = :user")
    Optional<ProviderProfile> findByUser(@Param("user") User user);

    @Query("SELECT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages WHERE p.user.id = :userId")
    Optional<ProviderProfile> findByUserId(@Param("userId") Long userId);

    List<ProviderProfile> findByServiceTypeAndIsAvailableTrue(ServiceType serviceType);
    List<ProviderProfile> findByIsAvailableTrue();
    List<ProviderProfile> findByProfileStatus(ProfileStatus status);
    
    @Query("SELECT p FROM ProviderProfile p WHERE p.user.city = :city")
    List<ProviderProfile> findByUserCity(@Param("city") String city);
    
    @Query("SELECT DISTINCT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages WHERE p.user.city = :city AND p.serviceType = :serviceType AND p.isAvailable = true")
    List<ProviderProfile> findByUserCityAndServiceTypeAndIsAvailableTrue(@Param("city") String city, @Param("serviceType") ServiceType serviceType);

    @Query("SELECT DISTINCT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages")
    List<ProviderProfile> findAllWithImages();

    // Haversine formula for distance calculation (in Kilometers)
    @Query("SELECT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages WHERE " +
           "p.profileStatus = 'APPROVED' AND " +
           "p.locationLat IS NOT NULL AND p.locationLng IS NOT NULL AND " +
           "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.locationLat)) * " +
           "cos(radians(p.locationLng) - radians(:userLng)) + " +
           "sin(radians(:userLat)) * sin(radians(p.locationLat)))) <= :maxDistance")
    List<ProviderProfile> findAllWithinDistance(
            @Param("userLat") Double userLat,
            @Param("userLng") Double userLng,
            @Param("maxDistance") Double maxDistance);

    @Query("SELECT p FROM ProviderProfile p LEFT JOIN FETCH p.portfolioImages WHERE " +
           "p.profileStatus = 'APPROVED' AND " +
           "p.serviceType = :serviceType AND " +
           "p.isAvailable = true AND " +
           "p.locationLat IS NOT NULL AND p.locationLng IS NOT NULL AND " +
           "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.locationLat)) * " +
           "cos(radians(p.locationLng) - radians(:userLng)) + " +
           "sin(radians(:userLat)) * sin(radians(p.locationLat)))) <= :maxDistance")
    List<ProviderProfile> findByServiceTypeAndDistance(
            @Param("serviceType") ServiceType serviceType,
            @Param("userLat") Double userLat,
            @Param("userLng") Double userLng,
            @Param("maxDistance") Double maxDistance);

    Long countByIsApprovedTrue();
}
