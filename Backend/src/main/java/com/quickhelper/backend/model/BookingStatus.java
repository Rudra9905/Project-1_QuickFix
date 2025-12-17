package com.quickhelper.backend.model;

// Workflow states for a booking lifecycle
public enum BookingStatus {
    REQUESTED,  // User submitted booking
    ACCEPTED,   // Provider accepted
    REJECTED,   // Provider rejected
    CANCELLED,  // Cancelled by user/provider
    COMPLETED   // Service finished
}
