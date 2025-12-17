package com.quickhelper.backend.model;

// Event types used to categorize notifications for users and providers
public enum NotificationType {
    // User notifications
    BOOKING_REQUEST_SENT,
    BOOKING_ACCEPTED,
    BOOKING_REJECTED,
    PROVIDER_ON_WAY,
    LIVE_LOCATION_STARTED,
    SERVICE_STARTED,
    SERVICE_COMPLETED,
    PAYMENT_CONFIRMED,
    RATING_REMINDER,
    
    // Provider notifications
    NEW_BOOKING_REQUEST,
    BOOKING_CANCELLED,
    JOB_ACCEPTED,
    NAVIGATION_STARTED,
    JOB_COMPLETED,
    EARNINGS_CREDITED
}

