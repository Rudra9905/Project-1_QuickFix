package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.ReviewRequestDTO;
import com.quickhelper.backend.dto.ReviewResponseDTO;
import com.quickhelper.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
// Review submission and retrieval endpoints
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    // Creates a review for a completed booking
    public ResponseEntity<ReviewResponseDTO> createReview(@Valid @RequestBody ReviewRequestDTO request) {
        ReviewResponseDTO review = reviewService.createReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/provider/{providerId}")
    // Lists reviews associated with a provider
    public ResponseEntity<List<ReviewResponseDTO>> getReviewsByProvider(@PathVariable Long providerId) {
        List<ReviewResponseDTO> reviews = reviewService.getReviewsByProvider(providerId);
        return ResponseEntity.ok(reviews);
    }
}
