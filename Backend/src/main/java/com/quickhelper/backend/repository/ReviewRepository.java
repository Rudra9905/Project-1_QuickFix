package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.Booking;
import com.quickhelper.backend.model.Review;
import com.quickhelper.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// JPA repository for reviews with helpers to fetch by booking/provider
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBooking(Booking booking);
    List<Review> findByBooking_Provider(User provider);
}
