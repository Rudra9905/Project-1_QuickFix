-- Drop the old constraint
ALTER TABLE bookings DROP CONSTRAINT chk_bookings_status;

-- Add the new constraint including IN_PROGRESS
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS'));
