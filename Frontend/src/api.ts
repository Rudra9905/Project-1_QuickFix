// Role type: defines user roles in the system
export type Role = 'USER' | 'PROVIDER'

// AuthResponse type: response structure after authentication
export type AuthResponse = {
  token: string // JWT authentication token
  role: Role // User's role
  userId: number // User's unique identifier
  providerId?: number | null // Optional provider profile ID (if user is a provider)
}

// Provider type: represents a service provider
export type Provider = {
  id: number // Provider's unique identifier
  name: string // Provider's name
  serviceType: string // Type of service offered
  description: string // Description of services
  latitude?: number // Optional latitude coordinate
  longitude?: number // Optional longitude coordinate
  available: boolean // Whether provider is currently available
}

// Booking type: represents a service booking
export type Booking = {
  id: number // Booking's unique identifier
  userId: number // ID of the user who made the booking
  providerId: number // ID of the provider
  serviceType: string // Type of service being booked
  address: string // Service address
  latitude: number // Latitude coordinate of service location
  longitude: number // Longitude coordinate of service location
  status: string // Current booking status
}

// API base URL: gets the base URL from environment variables or defaults to localhost
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'

// Generic API function: makes HTTP requests to the backend API
// @param path - API endpoint path (e.g., '/api/auth/login')
// @param options - Fetch API options (method, body, etc.)
// @param token - Optional JWT token for authentication
// @returns Promise that resolves to the response data
// @throws Error if the request fails
async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  // Make HTTP request to the API
  const res = await fetch(`${API_BASE}${path}`, {
    ...options, // Spread provided options (method, body, etc.)
    headers: {
      'Content-Type': 'application/json', // Set content type to JSON
      ...(options.headers || {}), // Merge any additional headers from options
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // Add auth header if token provided
    },
  })
  
  // Check if response is successful (status 200-299)
  if (!res.ok) {
    const text = await res.text() // Get error message from response
    throw new Error(text || `Request failed: ${res.status}`) // Throw error with message
  }
  
  // Parse and return JSON response
  return res.json() as Promise<T>
}

// Authentication API: functions for user authentication
export const authApi = {
  // Register a new user account
  // @param body - Registration data (name, email, password, phone, role)
  // @returns Promise that resolves to AuthResponse with token
  register: (body: {
    name: string
    email: string
    password: string
    phone: string
    role: Role
  }) => api<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  
  // Login with email and password
  // @param body - Login credentials (email, password)
  // @returns Promise that resolves to AuthResponse with token
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
}

// User API: functions for regular user operations
export const userApi = {
  // Get list of providers filtered by service type
  // @param serviceType - Type of service to search for
  // @param token - JWT authentication token
  // @returns Promise that resolves to array of Provider objects
  providers: (serviceType: string, token: string) =>
    api<Provider[]>(`/api/user/providers?serviceType=${encodeURIComponent(serviceType)}`, {}, token),
  
  // Create a new booking request
  // @param body - Booking details (userId, providerId, serviceType, address, coordinates)
  // @param token - JWT authentication token
  // @returns Promise that resolves to created Booking object
  book: (
    body: {
      userId: number
      providerId: number
      serviceType: string
      address: string
      latitude: number
      longitude: number
    },
    token: string
  ) => api<Booking>('/api/user/book', { method: 'POST', body: JSON.stringify(body) }, token),
  
  // Get all bookings for a specific user
  // @param userId - ID of the user
  // @param token - JWT authentication token
  // @returns Promise that resolves to array of Booking objects
  bookings: (userId: number, token: string) =>
    api<Booking[]>(`/api/user/bookings/${userId}`, {}, token),
}

// Provider API: functions for service provider operations
export const providerApi = {
  // Get all booking requests for a provider
  // @param providerId - ID of the provider
  // @param token - JWT authentication token
  // @returns Promise that resolves to array of Booking objects
  requests: (providerId: number, token: string) =>
    api<Booking[]>(`/api/provider/requests/${providerId}`, {}, token),
  
  // Accept a booking request
  // @param bookingId - ID of the booking to accept
  // @param token - JWT authentication token
  // @returns Promise that resolves to updated Booking object
  accept: (bookingId: number, token: string) =>
    api<Booking>(`/api/provider/request/${bookingId}/accept`, { method: 'POST' }, token),
  
  // Reject a booking request
  // @param bookingId - ID of the booking to reject
  // @param token - JWT authentication token
  // @returns Promise that resolves to updated Booking object
  reject: (bookingId: number, token: string) =>
    api<Booking>(`/api/provider/request/${bookingId}/reject`, { method: 'POST' }, token),
}
