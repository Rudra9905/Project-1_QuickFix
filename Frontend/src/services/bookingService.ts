// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import type definitions for booking-related data structures
import type { Booking, BookingRequest } from '../types'

// Booking service object containing methods for booking-related API operations
export const bookingService = {
  // Creates a new booking request from a user to a provider
  // @param userId - The ID of the user creating the booking
  // @param data - Booking request details (providerId, serviceType, note, etc.)
  // @returns Promise that resolves to the created Booking object
  createBooking: async (
    userId: number,
    data: BookingRequest
  ): Promise<Booking> => {
    const response = await apiClient.post<Booking>(
      `/bookings?userId=${userId}`,
      data
    )
    return response.data
  },

  // Retrieves all bookings associated with a specific user
  // @param userId - The ID of the user whose bookings to fetch
  // @returns Promise that resolves to an array of Booking objects
  getBookingsByUser: async (userId: number): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>(`/bookings/user/${userId}`)
    return response.data
  },

  // Retrieves all bookings associated with a specific provider
  // @param providerId - The ID of the provider whose bookings to fetch
  // @returns Promise that resolves to an array of Booking objects
  getBookingsByProvider: async (providerId: number): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>(
      `/bookings/provider/${providerId}`
    )
    return response.data
  },

  // Accepts a pending booking request (called by provider)
  // @param bookingId - The ID of the booking to accept
  // @returns Promise that resolves to the updated Booking object with ACCEPTED status
  acceptBooking: async (bookingId: number): Promise<Booking> => {
    const response = await apiClient.put<Booking>(
      `/bookings/${bookingId}/accept`
    )
    return response.data
  },

  // Rejects a pending booking request (called by provider)
  // @param bookingId - The ID of the booking to reject
  // @returns Promise that resolves to the updated Booking object with REJECTED status
  rejectBooking: async (bookingId: number): Promise<Booking> => {
    const response = await apiClient.put<Booking>(
      `/bookings/${bookingId}/reject`
    )
    return response.data
  },

  // Cancels a booking (can be called by either user or provider)
  // @param bookingId - The ID of the booking to cancel
  // @returns Promise that resolves to the updated Booking object with CANCELLED status
  cancelBooking: async (bookingId: number): Promise<Booking> => {
    const response = await apiClient.put<Booking>(
      `/bookings/${bookingId}/cancel`
    )
    return response.data
  },

  // Marks a booking as completed (typically called by provider after service is done)
  // @param bookingId - The ID of the booking to mark as completed
  // @returns Promise that resolves to the updated Booking object with COMPLETED status
  completeBooking: async (bookingId: number): Promise<Booking> => {
    const response = await apiClient.put<Booking>(
      `/bookings/${bookingId}/complete`
    )
    return response.data
  },
}
