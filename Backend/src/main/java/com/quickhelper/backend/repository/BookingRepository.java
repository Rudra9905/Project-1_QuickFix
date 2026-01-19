package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.Booking;
import com.quickhelper.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// JPA repository for booking entities and lookups by user/provider
public interface BookingRepository extends JpaRepository<Booking, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider WHERE b.user = :user")
    List<Booking> findByUser(@org.springframework.data.repository.query.Param("user") User user);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider WHERE b.provider = :provider")
    List<Booking> findByProvider(@org.springframework.data.repository.query.Param("provider") User provider);
    List<Booking> findByStatusAndCreatedAtBefore(com.quickhelper.backend.model.BookingStatus status, java.time.LocalDateTime dateTime);
    Long countByStatus(com.quickhelper.backend.model.BookingStatus status);
}
