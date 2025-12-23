package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.Booking;
import com.quickhelper.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// JPA repository for booking entities and lookups by user/provider
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);
    List<Booking> findByProvider(User provider);
    List<Booking> findByStatusAndCreatedAtBefore(com.quickhelper.backend.model.BookingStatus status, java.time.LocalDateTime dateTime);
    Long countByStatus(com.quickhelper.backend.model.BookingStatus status);
}
