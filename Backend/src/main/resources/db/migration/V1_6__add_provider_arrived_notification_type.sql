-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;

-- Re-add the check constraint with the new PROVIDER_ARRIVED value
-- Providing all values from the NotificationType enum to be safe
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type CHECK (type IN (
    'BOOKING_REQUEST_SENT',
    'BOOKING_ACCEPTED',
    'BOOKING_REJECTED',
    'PROVIDER_ON_WAY',
    'PROVIDER_ARRIVED',
    'LIVE_LOCATION_STARTED',
    'SERVICE_STARTED',
    'SERVICE_COMPLETED',
    'PAYMENT_CONFIRMED',
    'RATING_REMINDER',
    'NEW_BOOKING_REQUEST',
    'BOOKING_CANCELLED',
    'JOB_ACCEPTED',
    'NAVIGATION_STARTED',
    'JOB_COMPLETED',
    'EARNINGS_CREDITED'
));
