-- Fix role column to accommodate ADMIN role
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL;