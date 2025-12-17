// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import type definitions for review-related data structures
import type { Review, ReviewRequest } from '../types'

// Review service object containing methods for review-related API operations
export const reviewService = {
  // Creates a new review for a completed booking
  // @param data - Review data including bookingId, rating, and optional comment
  // @returns Promise that resolves to the created Review object
  createReview: async (data: ReviewRequest): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews', data)
    return response.data
  },

  // Retrieves all reviews for a specific provider
  // @param providerId - The ID of the provider whose reviews to fetch
  // @returns Promise that resolves to an array of Review objects
  getReviewsByProvider: async (providerId: number): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(
      `/reviews/provider/${providerId}`
    )
    return response.data
  },
}
