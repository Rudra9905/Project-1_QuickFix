-- Add provider portfolio images table
CREATE TABLE provider_portfolio_images (
    provider_profile_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (provider_profile_id) REFERENCES provider_profiles(id) ON DELETE CASCADE
);

-- Add index for better query performance
CREATE INDEX idx_provider_portfolio_images_provider_profile_id ON provider_portfolio_images(provider_profile_id);