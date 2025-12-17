// Import React hooks and types
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
// Import notification service for API calls
import { notificationService } from '../services/notificationService'
// Import WebSocket service for real-time notifications
import { websocketService } from '../services/websocketService'
// Import Notification type definition
import type { Notification } from '../types/notification'
// Import authentication context to get current user
import { useAuth } from './AuthContext'
// Import toast notification library for user feedback
import toast from 'react-hot-toast'
// Import debug utilities for logging
import { logError, logInfo, logWarn } from '../utils/debugUtils'

// NotificationContextType interface: defines the shape of the notification context
interface NotificationContextType {
  notifications: Notification[] // Array of all notifications for the current user
  unreadCount: number // Count of unread notifications
  isLoading: boolean // Whether notifications are currently being loaded
  markAsRead: (notificationId: number) => Promise<void> // Function to mark a notification as read
  markAllAsRead: () => Promise<void> // Function to mark all notifications as read
  deleteNotification: (notificationId: number) => Promise<void> // Function to delete a notification
  refreshNotifications: () => Promise<void> // Function to manually refresh notifications
}

// Create the notification context with undefined default value
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// NotificationProvider component: provides notification context to the entire application
// Manages real-time notifications via WebSocket and provides fallback polling
// @param children - React components that will have access to the notification context
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  // Get current authenticated user from auth context
  const { user } = useAuth()
  // State to store all notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  // State to track count of unread notifications
  const [unreadCount, setUnreadCount] = useState(0)
  // State to track if notifications are being loaded
  const [isLoading, setIsLoading] = useState(false)
  // State to track when notifications were last fetched (for polling fallback)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Load notifications from the API
  // Fetches notifications and unread count based on user role
  const loadNotifications = async () => {
    // Don't load if user is not authenticated
    if (!user) return

    try {
      setIsLoading(true)
      // Fetch notifications and unread count in parallel for better performance
      const [notificationsData, count] = await Promise.all([
        // Fetch notifications based on user role (PROVIDER vs USER)
        user.role === 'PROVIDER' 
          ? notificationService.getProviderNotifications(user.id)
          : notificationService.getUserNotifications(user.id),
        // Fetch unread count for the user
        notificationService.getUnreadCount(user.id, user.role.toLowerCase() as 'user' | 'provider'),
      ])
      // Update state with fetched data
      setNotifications(notificationsData)
      setUnreadCount(Number(count))
      // Record the time of this fetch
      setLastFetchTime(Date.now())
    } catch (error) {
      // Log error for debugging
      logError('Failed to load notifications:', error)
      // Fallback: Show error to user
      toast.error('Failed to load notifications. Please try again.')
    } finally {
      // Always set loading to false, even if there was an error
      setIsLoading(false)
    }
  }

  // Handler for new notifications received via WebSocket
  // Called when a real-time notification is received from the server
  // @param notification - The new notification received
  const handleNewNotification = (notification: Notification) => {
    // Log notification receipt for debugging
    logInfo('=== NEW NOTIFICATION RECEIVED ===')
    logInfo('Notification:', notification)
    
    // Prevent duplicate notifications by checking if notification ID already exists
    setNotifications((prev) => {
      const exists = prev.some(n => n.id === notification.id)
      if (exists) {
        logWarn('Notification already exists, skipping:', notification.id)
        return prev // Return previous state if duplicate
      }
      // Add new notification to the beginning of the array (most recent first)
      return [notification, ...prev]
    })
    
    // Only increment unread count if the notification is unread
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1)
    }

    // Show toast notification to the user
    // High priority notifications show longer and use error styling
    const toastOptions: any = {
      duration: notification.isHighPriority ? 5000 : 3000, // 5s for high priority, 3s for normal
    }

    // Use different toast styles based on priority
    if (notification.isHighPriority) {
      toast.error(notification.title + ': ' + notification.message, toastOptions)
    } else {
      toast.success(notification.title + ': ' + notification.message, toastOptions)
    }
  }

  // Polling fallback for WebSocket failures
  useEffect(() => {
    if (!user) return

    const pollInterval = setInterval(() => {
      // Check if WebSocket is connected, if not, refresh notifications
      const status = websocketService.getConnectionStatus()
      if (!status.isConnected && Date.now() - lastFetchTime > 30000) { // 30 seconds
        logWarn('WebSocket not connected, polling for notifications')
        loadNotifications()
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(pollInterval)
  }, [user, lastFetchTime])

  useEffect(() => {
    if (user) {
      loadNotifications()
      
      // Small delay to ensure user is fully loaded
      const connectTimer = setTimeout(() => {
        logInfo('Connecting WebSocket for user:', user.id, 'role:', user.role)
        websocketService.connect(user.id, user.role, handleNewNotification)
      }, 500)

      return () => {
        clearTimeout(connectTimer)
        logInfo('Disconnecting WebSocket for user:', user?.id)
        websocketService.disconnect()
      }
    } else {
      websocketService.disconnect()
    }
  }, [user?.id]) // Only depend on user.id to avoid reconnecting on every user object change

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      logError('Failed to mark notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await notificationService.markAllAsRead(user.id, user.role.toLowerCase() as 'user' | 'provider')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      logError('Failed to mark all as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      // Note: We don't adjust unread count here since the notification might be read or unread
      toast.success('Notification deleted')
    } catch (error) {
      logError('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}