// User role type: defines the two possible roles in the system
export type UserRole = 'USER' | 'PROVIDER' | 'ADMIN'

// Service type: defines the types of services that providers can offer
export type ServiceType = 'PLUMBER' | 'ELECTRICIAN' | 'CLEANER' | 'LAUNDRY' | 'OTHER'

// Booking status: defines the possible states of a booking request
export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

// User interface: represents a user in the system
export interface User {
  id: number // Unique identifier for the user
  name: string // User's full name
  email: string // User's email address (used for login)
  role: UserRole // User's role (USER or PROVIDER)
  city?: string // Optional city where the user is located
}

// RegisterRequest interface: data structure for user registration
export interface RegisterRequest {
  name: string // User's full name
  email: string // User's email address
  password: string // User's password (will be hashed on backend)
  phone?: string // Optional phone number
  city?: string // Optional city location
  role: UserRole // User's role (USER or PROVIDER)
}

// LoginRequest interface: data structure for user login
export interface LoginRequest {
  email: string // User's email address
  password: string // User's password
}

// AuthResponse interface: response structure after successful authentication
export interface AuthResponse {
  id: number // User's unique identifier
  name: string // User's full name
  email: string // User's email address
  role: UserRole // User's role (USER or PROVIDER)
  city?: string // Optional city location
  token: string // JWT authentication token for subsequent API requests
}

// ProviderProfile interface: represents a service provider's profile
export type ProfileStatus = 'INCOMPLETE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface ProviderProfile {
  id: number // Unique identifier for the provider profile
  userId: number // ID of the user who owns this provider profile
  serviceType: ServiceType // Type of service the provider offers
  profileStatus: ProfileStatus // Lifecycle status for approval flow
  experienceYears?: number // Experience in years
  resumeUrl?: string // Resume PDF URL
  demoVideoUrl?: string // Demo video URL
  description?: string // Optional description of the provider's services
  basePrice?: number // Optional base price for the service
  rating: number // Average rating from customer reviews (0-5)
  isAvailable: boolean // Whether the provider is currently available for bookings
  isApproved: boolean // Whether the provider has been approved by admin
  locationLat?: number // Optional latitude coordinate for provider's location
  locationLng?: number // Optional longitude coordinate for provider's location
  rejectionReason?: string // Optional rejection message from admin
  portfolioImages?: string[] // Optional array of portfolio image URLs
  displayName?: string // Provider's display/business name
  profilePhotoUrl?: string // Profile photo URL
  tagline?: string // Professional tagline
  user?: { // Optional user info for display
    name: string
    city?: string
  }
}


// Provider service offering (multiple per provider)
export interface ServiceOffering {
  id: number
  providerId: number
  name: string
  description?: string
  price: number
  unit: string
  active: boolean
}

export interface ServiceOfferingRequest {
  name: string
  description?: string
  price: number
  unit: string
  active: boolean
}

// ProviderCreateRequest interface: data structure for creating a new provider profile
export interface ProviderCreateRequest {
  serviceType: ServiceType // Type of service the provider offers
  description?: string // Optional description of the provider's services
  experienceYears?: number // Experience in years
  resumeUrl?: string // Resume attachment URL
  demoVideoUrl?: string // Demo video URL
  basePrice?: number // Optional base price for the service
  locationLat: number // Latitude coordinate for provider's location (required)
  locationLng: number // Longitude coordinate for provider's location (required)
}

// Booking interface: represents a service booking between a user and provider
export interface Booking {
  id: number // Unique identifier for the booking
  user: User // User who requested the booking
  provider: User // Provider who will perform the service
  serviceType: ServiceType // Type of service being booked
  status: BookingStatus // Current status of the booking
  note?: string // Optional note from the user about the booking
  createdAt: string // Timestamp when the booking was created (ISO format)
  acceptedAt?: string // Optional timestamp when the booking was accepted
  completedAt?: string // Optional timestamp when the service was completed
  bookingDate?: string // Date of the service
  preferredTime?: string // Time of the service
}

// BookingRequest interface: data structure for creating a new booking request
export interface BookingRequest {
  providerId: number // ID of the provider to book
  serviceType: ServiceType // Type of service being requested
  note?: string // Optional note for the provider
  bookingDate?: string // Optional preferred date for the service (ISO format)
  preferredTime?: string // Optional preferred time for the service
}

// Review interface: represents a customer review for a completed booking
export interface Review {
  id: number // Unique identifier for the review
  bookingId: number // ID of the booking this review is for
  rating: number // Rating given by the user (typically 1-5)
  comment?: string // Optional text comment from the user
  createdAt: string // Timestamp when the review was created (ISO format)
}

// ReviewRequest interface: data structure for creating a new review
export interface ReviewRequest {
  bookingId: number // ID of the completed booking to review
  rating: number // Rating to give (typically 1-5)
  comment?: string // Optional text comment
}

// AvailabilityUpdate interface: data structure for updating provider availability
export interface AvailabilityUpdate {
  isAvailable: boolean // Whether the provider is available for new bookings
}

// LocationUpdate interface: data structure for updating provider location
export interface LocationUpdate {
  locationLat: number // New latitude coordinate
  locationLng: number // New longitude coordinate
}
