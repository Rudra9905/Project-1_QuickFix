// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import the Notification type definition
import type { Notification } from '../types/notification'
// Import debug utilities for error logging
import { logError, logWarn, withFallback } from '../utils/debugUtils'

// Notification service object containing methods for notification-related API operations
export const notificationService = {
  // Fetches all notifications for a specific user
  // @param userId - The ID of the user whose notifications to fetch
  // @returns Promise that resolves to an array of Notification objects
  getUserNotifications: async (userId: number): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(`/notifications/user/${userId}`)
      return response.data
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to fetch user notifications', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },

  // Fetches all notifications for a specific provider
  // @param providerId - The ID of the provider whose notifications to fetch
  // @returns Promise that resolves to an array of Notification objects
  getProviderNotifications: async (providerId: number): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(`/notifications/provider/${providerId}`)
      return response.data
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to fetch provider notifications', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },

  // Fetches only unread notifications for a user or provider
  // @param userId - The ID of the user/provider
  // @param role - The role of the user ('user' or 'provider')
  // @returns Promise that resolves to an array of unread Notification objects
  getUnreadNotifications: async (userId: number, role: 'user' | 'provider'): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(`/notifications/${role}/${userId}/unread`)
      return response.data
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to fetch unread notifications', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },

  // Gets the count of unread notifications for a user or provider
  // @param userId - The ID of the user/provider
  // @param role - The role of the user ('user' or 'provider')
  // @returns Promise that resolves to the number of unread notifications (returns 0 on error)
  getUnreadCount: async (userId: number, role: 'user' | 'provider'): Promise<number> => {
    try {
      const response = await apiClient.get<number>(`/notifications/${role}/${userId}/unread-count`)
      return response.data
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to fetch unread count', error)
      // Fallback: Return 0 if unable to fetch count to prevent UI errors
      return 0
    }
  },

  // Marks a specific notification as read
  // @param notificationId - The ID of the notification to mark as read
  // @returns Promise that resolves to the updated Notification object
  markAsRead: async (notificationId: number): Promise<Notification> => {
    try {
      const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to mark notification as read', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },

  // Marks all notifications as read for a user or provider
  // @param userId - The ID of the user/provider
  // @param role - The role of the user ('user' or 'provider')
  // @returns Promise that resolves to void
  markAllAsRead: async (userId: number, role: 'user' | 'provider'): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${role}/${userId}/read-all`)
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to mark all notifications as read', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },

  // Deletes a specific notification
  // @param notificationId - The ID of the notification to delete
  // @returns Promise that resolves to void
  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`)
    } catch (error) {
      // Log the error for debugging purposes
      logError('Failed to delete notification', error)
      // Re-throw the error so calling code can handle it
      throw error
    }
  },
}