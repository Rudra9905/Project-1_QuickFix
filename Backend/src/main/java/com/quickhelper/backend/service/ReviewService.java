package com.quickhelper.backend.service;

import com.quickhelper.backend.dto.ReviewRequestDTO;
import com.quickhelper.backend.dto.ReviewResponseDTO;
import com.quickhelper.backend.exception.BadRequestException;
import com.quickhelper.backend.exception.ResourceNotFoundException;
import com.quickhelper.backend.model.*;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import com.quickhelper.backend.repository.BookingRepository;
import com.quickhelper.backend.repository.ReviewRepository;
import com.quickhelper.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
// Handles review creation and provider rating aggregation
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;  // ✅ ADD THIS

    @Transactional
    // Creates a review for a completed booking and recalculates provider rating
    public ReviewResponseDTO createReview(ReviewRequestDTO request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.getBookingId()));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Can only review completed bookings");
        }

        if (reviewRepository.findByBooking(booking).isPresent()) {
            throw new BadRequestException("Review already exists for this booking");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);

        updateProviderRating(booking.getProvider());

        return mapToReviewResponseDTO(saved);
    }

    // Returns all reviews for a provider
    public List<ReviewResponseDTO> getReviewsByProvider(Long providerId) {
        User provider = userRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found with id: " + providerId));

        return reviewRepository.findByBooking_Provider(provider)
                .stream()
                .map(this::mapToReviewResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    // Recomputes the provider's average rating from all reviews
    private void updateProviderRating(User provider) {
        Optional<ProviderProfile> profileOpt = providerProfileRepository.findByUser(provider);

        if (profileOpt.isPresent()) {
            List<Review> reviews = reviewRepository.findByBooking_Provider(provider);

            if (!reviews.isEmpty()) {
                double averageRating = reviews.stream()
                        .mapToInt(Review::getRating)
                        .average()
                        .orElse(0.0);

                ProviderProfile profile = profileOpt.get();
                profile.setRating(averageRating);

                providerProfileRepository.save(profile);
            }
        }
    }

    // Maps Review entity to API response DTO
    private ReviewResponseDTO mapToReviewResponseDTO(Review review) {
        return new ReviewResponseDTO(
                review.getId(),
                review.getBooking().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
