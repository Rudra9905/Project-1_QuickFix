// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import type definitions for authentication-related requests and responses
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types'

// Authentication service object containing methods for user authentication operations
export const authService = {
  // Registers a new user account in the system
  // @param data - Registration data including name, email, password, role, etc.
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  // Authenticates an existing user and returns a JWT token
  // @param data - Login credentials (email and password)
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },
}
