// Import the configured API client
import { apiClient } from './apiClient'
// Import type definitions for authentication-related requests and responses
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types'

// Authentication service object containing methods for user authentication operations
export const authService = {
  // Registers a new user account in the system
  // @param data - Registration data including name, email, password, role, etc.
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Uses apiClient which respects VITE_API_BASE
    // The path is relative to the base URL (e.g., /auth/register becomes .../api/auth/register)
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  // Authenticates an existing user and returns a JWT token
  // @param data - Login credentials (email and password)
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Uses apiClient which respects VITE_API_BASE
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },
}

