package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.ServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {
    List<ServiceOffering> findByProviderProfileId(Long providerProfileId);
}



