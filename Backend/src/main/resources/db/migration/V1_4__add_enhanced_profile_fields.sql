-- Add enhanced profile fields to provider_profiles table
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);
