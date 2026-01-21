-- Booking status index (critical for filtering)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON booking(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON booking(created_at DESC);

-- User role index
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Provider status and availability indexes
CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON provider_profile(profile_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_available ON provider_profile(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_provider_profiles_service_type ON provider_profile(service_type);

-- Notification read status (composite index for common query)
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_read ON notification(user_id, is_read);
