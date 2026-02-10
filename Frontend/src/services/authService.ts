// Import axios for making HTTP requests directly
import axios from 'axios'
// Import type definitions for authentication-related requests and responses
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types'

// Auth endpoints always use /api prefix to ensure correct routing regardless of
// apiClient baseURL configuration or environment variables.
// This prevents the "No static resource auth/login" error that occurs when
// requests reach the backend without the /api prefix.
const AUTH_BASE = '/api/auth'

// Authentication service object containing methods for user authentication operations
export const authService = {
  // Registers a new user account in the system
  // @param data - Registration data including name, email, password, role, etc.
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${AUTH_BASE}/register`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    return response.data
  },

  // Authenticates an existing user and returns a JWT token
  // @param data - Login credentials (email and password)
  // @returns Promise that resolves to AuthResponse containing user info and JWT token
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${AUTH_BASE}/login`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
    return response.data
  },
}
