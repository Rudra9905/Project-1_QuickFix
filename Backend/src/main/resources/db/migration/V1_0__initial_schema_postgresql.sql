-- Initial PostgreSQL schema for Quick Helper application

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    phone VARCHAR(255),
    city VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Provider profiles table
CREATE TABLE provider_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    profile_status VARCHAR(255) NOT NULL DEFAULT 'INCOMPLETE',
    experience_years INTEGER,
    resume_url VARCHAR(255),
    demo_video_url VARCHAR(255),
    description TEXT,
    base_price INTEGER,
    rating DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Service offerings table
CREATE TABLE service_offerings (
    id BIGSERIAL PRIMARY KEY,
    provider_profile_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    unit VARCHAR(255) NOT NULL DEFAULT 'hr',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id)
);

-- Bookings table
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'REQUESTED',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- Reviews table
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    receiver_id BIGINT NOT NULL,
    receiver_role VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_high_priority BOOLEAN NOT NULL DEFAULT FALSE,
    related_booking_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_provider_profiles_user_id ON provider_profiles(user_id);
CREATE INDEX idx_service_offerings_provider_profile_id ON service_offerings(provider_profile_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_notifications_receiver_id ON notifications(receiver_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Add constraints for ENUM-like values
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'PROVIDER', 'ADMIN'));
ALTER TABLE provider_profiles ADD CONSTRAINT chk_provider_profiles_service_type CHECK (service_type IN ('PLUMBER', 'ELECTRICIAN', 'CLEANER', 'LAUNDRY', 'OTHER'));
ALTER TABLE provider_profiles ADD CONSTRAINT chk_provider_profiles_profile_status CHECK (profile_status IN ('INCOMPLETE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'));
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_service_type CHECK (service_type IN ('PLUMBER', 'ELECTRICIAN', 'CLEANER', 'LAUNDRY', 'OTHER'));
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'));
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_receiver_role CHECK (receiver_role IN ('USER', 'PROVIDER'));
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type CHECK (type IN ('BOOKING_REQUEST_SENT', 'BOOKING_ACCEPTED', 'BOOKING_REJECTED', 'PROVIDER_ON_WAY', 'LIVE_LOCATION_STARTED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_CONFIRMED', 'RATING_REMINDER', 'NEW_BOOKING_REQUEST', 'BOOKING_CANCELLED', 'JOB_ACCEPTED', 'NAVIGATION_STARTED', 'JOB_COMPLETED', 'EARNINGS_CREDITED'));

-- Insert initial data if needed
-- INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'admin@example.com', 'hashed_password', 'ADMIN');
