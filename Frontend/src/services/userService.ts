// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import the User type definition
import type { User } from '../types'

// User service object containing methods for user-related API operations
export const userService = {
  // Fetches the current user's profile information by user ID
  // @param userId - The ID of the user to fetch
  // @returns Promise that resolves to the User object
  getMe: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/me?userId=${userId}`)
    return response.data
  },

  // Fetches a specific user's information by their ID
  // @param id - The ID of the user to fetch
  // @returns Promise that resolves to the User object
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`)
    return response.data
  },

  // Fetches all users from the system
  // @returns Promise that resolves to an array of User objects
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  // Updates a user's city
  // @param id - The ID of the user to update
  // @param city - The new city value
  // @returns Promise that resolves to the updated User object
  updateUserCity: async (id: number, city: string): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}/city`, city, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    return response.data
  }
}