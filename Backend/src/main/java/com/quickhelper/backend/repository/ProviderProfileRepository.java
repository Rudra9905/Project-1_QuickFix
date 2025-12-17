package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// JPA repository for provider profiles with city/service availability lookups
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    Optional<ProviderProfile> findByUser(User user);
    List<ProviderProfile> findByServiceTypeAndIsAvailableTrue(ServiceType serviceType);
    List<ProviderProfile> findByIsAvailableTrue();
    
    @Query("SELECT p FROM ProviderProfile p WHERE p.user.city = :city")
    List<ProviderProfile> findByUserCity(@Param("city") String city);
    
    @Query("SELECT p FROM ProviderProfile p WHERE p.user.city = :city AND p.serviceType = :serviceType AND p.isAvailable = true")
    List<ProviderProfile> findByUserCityAndServiceTypeAndIsAvailableTrue(@Param("city") String city, @Param("serviceType") ServiceType serviceType);
}