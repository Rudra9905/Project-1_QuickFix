-- Fix role column to accommodate ADMIN role (PostgreSQL syntax)
ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(20),
    ALTER COLUMN role SET NOT NULL;
