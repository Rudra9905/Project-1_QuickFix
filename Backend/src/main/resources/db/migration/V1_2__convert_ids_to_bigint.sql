-- Align existing tables with BIGINT identifiers expected by JPA entities

-- Drop old foreign keys to allow type changes
ALTER TABLE IF EXISTS provider_profiles DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey;
ALTER TABLE IF EXISTS service_offerings DROP CONSTRAINT IF EXISTS service_offerings_provider_profile_id_fkey;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS bookings_provider_id_fkey;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;

-- Users
ALTER TABLE users
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT;
ALTER SEQUENCE IF EXISTS users_id_seq AS BIGINT;

-- Provider profiles
ALTER TABLE provider_profiles
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
ALTER SEQUENCE IF EXISTS provider_profiles_id_seq AS BIGINT;

-- Service offerings
ALTER TABLE service_offerings
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN provider_profile_id TYPE BIGINT USING provider_profile_id::BIGINT;
ALTER SEQUENCE IF EXISTS service_offerings_id_seq AS BIGINT;

-- Bookings
ALTER TABLE bookings
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT,
    ALTER COLUMN provider_id TYPE BIGINT USING provider_id::BIGINT;
ALTER SEQUENCE IF EXISTS bookings_id_seq AS BIGINT;

-- Reviews
ALTER TABLE reviews
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN booking_id TYPE BIGINT USING booking_id::BIGINT;
ALTER SEQUENCE IF EXISTS reviews_id_seq AS BIGINT;

-- Notifications
ALTER TABLE notifications
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN receiver_id TYPE BIGINT USING receiver_id::BIGINT,
    ALTER COLUMN related_booking_id TYPE BIGINT USING related_booking_id::BIGINT;
ALTER SEQUENCE IF EXISTS notifications_id_seq AS BIGINT;

-- Recreate foreign keys with explicit names
ALTER TABLE provider_profiles
    ADD CONSTRAINT fk_provider_profiles_user FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE service_offerings
    ADD CONSTRAINT fk_service_offerings_provider_profile FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id);

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
    ADD CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES users(id);

ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id);
