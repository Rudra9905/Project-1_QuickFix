// NotificationType enum: defines all possible types of notifications in the system
export enum NotificationType {
  // User notifications: notifications sent to regular users
  BOOKING_REQUEST_SENT = 'BOOKING_REQUEST_SENT', // Confirmation that booking request was sent
  BOOKING_ACCEPTED = 'BOOKING_ACCEPTED', // Provider accepted the booking
  BOOKING_REJECTED = 'BOOKING_REJECTED', // Provider rejected the booking
  PROVIDER_ON_WAY = 'PROVIDER_ON_WAY', // Provider is on the way to the service location
  LIVE_LOCATION_STARTED = 'LIVE_LOCATION_STARTED', // Provider started sharing live location
  SERVICE_STARTED = 'SERVICE_STARTED', // Provider started the service
  SERVICE_COMPLETED = 'SERVICE_COMPLETED', // Service has been completed
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED', // Payment for the service was confirmed
  RATING_REMINDER = 'RATING_REMINDER', // Reminder to rate the completed service
  
  // Provider notifications: notifications sent to service providers
  NEW_BOOKING_REQUEST = 'NEW_BOOKING_REQUEST', // New booking request received
  BOOKING_CANCELLED = 'BOOKING_CANCELLED', // User cancelled a booking
  JOB_ACCEPTED = 'JOB_ACCEPTED', // Confirmation that provider accepted a job
  NAVIGATION_STARTED = 'NAVIGATION_STARTED', // User started navigation to service location
  JOB_COMPLETED = 'JOB_COMPLETED', // Job was marked as completed
  EARNINGS_CREDITED = 'EARNINGS_CREDITED', // Earnings from completed job were credited
}

// Notification interface: represents a notification in the system
export interface Notification {
  id: number // Unique identifier for the notification
  userId: number // ID of the user/provider who should receive this notification
  type: NotificationType // Type of notification (determines content and behavior)
  title: string // Short title/summary of the notification
  message: string // Detailed message content
  isRead: boolean // Whether the notification has been read by the user
  isHighPriority: boolean // Whether this is a high-priority notification (affects display)
  relatedBookingId?: number // Optional ID of the related booking (if applicable)
  createdAt: string // Timestamp when the notification was created (ISO format)
}

