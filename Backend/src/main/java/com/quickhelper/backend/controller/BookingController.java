package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.BookingRequestDTO;
import com.quickhelper.backend.dto.BookingResponseDTO;
import com.quickhelper.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
// Booking lifecycle endpoints for users and providers
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    // Creates a booking request for a user
    public ResponseEntity<BookingResponseDTO> createBooking(
            @RequestParam Long userId,
            @Valid @RequestBody BookingRequestDTO request) {
        BookingResponseDTO booking = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/user/{userId}")
    // Returns bookings initiated by a specific user
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByUser(@PathVariable Long userId) {
        List<BookingResponseDTO> bookings = bookingService.getBookingsByUser(userId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/provider/{providerId}")
    // Returns bookings assigned to a provider
    public ResponseEntity<List<BookingResponseDTO>> getBookingsByProvider(@PathVariable Long providerId) {
        List<BookingResponseDTO> bookings = bookingService.getBookingsByProvider(providerId);
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{bookingId}/accept")
    // Provider accepts a pending booking
    public ResponseEntity<BookingResponseDTO> acceptBooking(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.acceptBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/reject")
    // Provider rejects a pending booking
    public ResponseEntity<BookingResponseDTO> rejectBooking(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.rejectBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/cancel")
    // Cancels a booking (user or provider)
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/complete")
    // Marks a booking as completed after service delivery
    public ResponseEntity<BookingResponseDTO> completeBooking(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.completeBooking(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/on-way")
    // Provider status: on the way to customer
    public ResponseEntity<BookingResponseDTO> providerOnWay(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.providerOnWay(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/start-service")
    // Provider status: service started
    public ResponseEntity<BookingResponseDTO> startService(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.startService(bookingId);
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{bookingId}/confirm-payment")
    // Payment confirmation for a booking
    public ResponseEntity<BookingResponseDTO> confirmPayment(@PathVariable Long bookingId) {
        BookingResponseDTO booking = bookingService.confirmPayment(bookingId);
        return ResponseEntity.ok(booking);
    }
}