// Import SockJS for WebSocket connection (fallback for browsers that don't support native WebSocket)
import SockJS from 'sockjs-client'
// Import STOMP client for message-oriented middleware protocol over WebSocket
import { Client, IMessage } from '@stomp/stompjs'
// Import the Notification type definition
import type { Notification } from '../types/notification'

// Helper function to get the API base URL from environment variables
// @ts-ignore
const getApiUrl = (): string => {
  // @ts-ignore
  // Returns the API base URL from environment variables, or defaults to localhost:8080/api
  return import.meta.env ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api' : 'http://localhost:8080/api'
}

// WebSocketService class manages real-time WebSocket connections for receiving notifications
// Uses STOMP protocol over SockJS for reliable message delivery
class WebSocketService {
  // STOMP client instance for managing WebSocket connection
  private client: Client | null = null
  // Flag indicating whether WebSocket is currently connected
  private isConnected = false
  // Counter for tracking reconnection attempts
  private reconnectAttempts = 0
  // Maximum number of reconnection attempts before giving up
  private maxReconnectAttempts = 5
  // Base delay (in milliseconds) between reconnection attempts
  private reconnectDelay = 5000
  // ID of the currently connected user
  private userId: number | null = null
  // Role of the currently connected user (USER or PROVIDER)
  private userRole: string | null = null
  // Callback function to handle incoming notifications
  private onNotificationCallback: ((notification: Notification) => void) | null = null
  // STOMP subscription object for unsubscribing when needed
  private subscription: any = null
  // Timeout reference for scheduled reconnection attempts
  private reconnectTimeout: any = null

  // Connects to the WebSocket server for real-time notifications
  // @param userId - The ID of the user to connect as
  // @param userRole - The role of the user (USER or PROVIDER)
  // @param onNotification - Callback function to handle incoming notifications
  connect(userId: number, userRole: string, onNotification: (notification: Notification) => void) {
    // If already connected to the same user, don't reconnect (prevents duplicate connections)
    if (this.isConnected && this.userId === userId && this.userRole === userRole && this.client) {
      console.log('WebSocket already connected to user:', userId, 'role:', userRole)
      return
    }

    // Store connection parameters
    this.userId = userId
    this.userRole = userRole.toLowerCase() // Normalize role to lowercase for topic subscription
    this.onNotificationCallback = onNotification

    // Clear any existing reconnection timeout to prevent multiple reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Disconnect existing connection if any (cleanup before new connection)
    this.disconnect()

    // Get JWT token from localStorage for authentication
    const token = localStorage.getItem('token')
    if (!token || token === 'token-placeholder') {
      console.error('No valid JWT token found')
      // Schedule reconnection attempt if token is missing
      this.scheduleReconnect()
      return
    }

    // Construct WebSocket URL with token parameter for authentication
    let wsUrl: string
    const apiUrl = getApiUrl()
    
    // Determine WebSocket URL based on environment (development vs production)
    if (apiUrl.includes('localhost:8080') || apiUrl.includes('127.0.0.1:8080')) {
      // Development - direct connection to localhost
      wsUrl = `http://localhost:8080/ws?token=${token}`
    } else {
      // Production - construct from API URL by removing /api suffix
      const baseUrl = apiUrl.replace('/api', '')
      wsUrl = `${baseUrl}/ws?token=${token}`
    }
    
    console.log('Connecting to WebSocket:', wsUrl)

    // Create SockJS socket connection (provides WebSocket-like API with fallbacks)
    // @ts-ignore
    const socket = new SockJS(wsUrl)
    
    // Create STOMP client with configuration
    this.client = new Client({
      webSocketFactory: () => socket as any, // Use SockJS as the underlying transport
      reconnectDelay: this.reconnectDelay, // Delay between automatic reconnection attempts
      heartbeatIncoming: 4000, // Expected interval for incoming heartbeat messages (4 seconds)
      heartbeatOutgoing: 4000, // Interval for sending outgoing heartbeat messages (4 seconds)
      debug: (str) => {
        // Debug logging for STOMP protocol messages
        console.log('STOMP:', str)
      },
      onConnect: (frame) => {
        // Callback executed when WebSocket connection is successfully established
        console.log('WebSocket connected successfully', frame)
        this.isConnected = true
        this.reconnectAttempts = 0 // Reset reconnection counter on successful connection

        // Subscribe to user-specific notification topic for receiving real-time notifications
        if (this.client && userId && this.userRole) {
          // Construct topic path based on user role and ID (e.g., /topic/user/123/notifications)
          const topic = `/topic/${this.userRole}/${userId}/notifications`
          console.log('Subscribing to topic:', topic)
          
          // Unsubscribe from previous subscription if exists (cleanup)
          if (this.subscription) {
            this.subscription.unsubscribe()
          }
          
          // Subscribe to the notification topic and handle incoming messages
          this.subscription = this.client.subscribe(topic, (message: IMessage) => {
            try {
              // Log notification receipt for debugging
              console.log('=== NOTIFICATION RECEIVED ===')
              console.log('Raw message body:', message.body)
              console.log('Message headers:', message.headers)
              
              // Parse JSON notification from message body
              const notification: Notification = JSON.parse(message.body)
              console.log('Parsed notification:', notification)
              console.log('Notification ID:', notification.id)
              console.log('Notification Title:', notification.title)
              console.log('Notification Message:', notification.message)
              
              // Call the registered callback function to handle the notification
              if (this.onNotificationCallback) {
                console.log('Calling notification callback...')
                this.onNotificationCallback(notification)
                console.log('✓ Notification callback executed')
              } else {
                console.warn('No notification callback registered!')
              }
              console.log('==========================')
            } catch (error) {
              // Handle JSON parsing errors
              console.error('✗ Error parsing notification:', error)
              console.error('Message body that failed:', message.body)
            }
          })
          
          console.log('Successfully subscribed to notifications')
        }
      },
      onDisconnect: () => {
        // Callback executed when WebSocket connection is lost
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.subscription = null // Clear subscription reference
        
        // Schedule automatic reconnection if user is still logged in (not manually disconnected)
        if (this.userId && this.userRole) {
          this.scheduleReconnect()
        }
      },
      onStompError: (frame) => {
        // Callback executed when STOMP protocol error occurs
        console.error('STOMP error:', frame)
        this.handleConnectionError()
      },
      onWebSocketError: (event) => {
        // Callback executed when WebSocket connection error occurs
        console.error('WebSocket error:', event)
        this.handleConnectionError()
      },
      onUnhandledFrame: (frame) => {
        // Callback for frames that don't match any expected pattern (for debugging)
        console.log('Unhandled frame:', frame)
      },
      onUnhandledMessage: (message) => {
        // Callback for messages that don't match any subscription (for debugging)
        console.log('Unhandled message:', message)
      },
    })

    try {
      // Activate the STOMP client to establish the WebSocket connection
      this.client.activate()
      console.log('WebSocket client activated')
    } catch (error) {
      // Handle errors during client activation
      console.error('Error activating WebSocket client:', error)
      this.handleConnectionError()
    }
  }

  // Handles connection errors and manages reconnection logic
  private handleConnectionError() {
    this.isConnected = false
    this.reconnectAttempts++ // Increment reconnection attempt counter
    
    // Stop trying to reconnect after maximum attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.disconnect() // Give up and disconnect
    } else {
      // Schedule another reconnection attempt
      this.scheduleReconnect()
    }
  }

  // Schedules a reconnection attempt with exponential backoff
  private scheduleReconnect() {
    // Clear any existing reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    
    // Exponential backoff: increase delay with each attempt (1.5x multiplier)
    // This prevents overwhelming the server with rapid reconnection attempts
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`)
    
    // Schedule reconnection after calculated delay
    this.reconnectTimeout = setTimeout(() => {
      if (this.userId && this.userRole) {
        console.log('Attempting to reconnect...')
        // Attempt to reconnect with stored user credentials
        this.connect(this.userId, this.userRole, this.onNotificationCallback!)
      }
    }, delay)
  }

  // Disconnects from WebSocket server and cleans up resources
  disconnect() {
    // Clear reconnection timeout to prevent scheduled reconnections
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    // Unsubscribe from notification topic if subscribed
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    
    // Deactivate STOMP client and close WebSocket connection
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (error) {
        console.error('Error deactivating client:', error)
      }
      this.client = null
    }
    
    // Reset all connection state
    this.isConnected = false
    this.userId = null
    this.userRole = null
    this.onNotificationCallback = null
    this.reconnectAttempts = 0
  }

  // Checks if currently connected to a specific user
  // @param userId - The user ID to check connection for
  // @returns true if connected to the specified user, false otherwise
  isConnectedToUser(userId: number): boolean {
    return this.isConnected && this.userId === userId
  }

  // Gets the current connection status and user information
  // @returns Object containing connection status, userId, and userRole
  getConnectionStatus(): { isConnected: boolean; userId: number | null; userRole: string | null } {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      userRole: this.userRole,
    }
  }
}

// Export a singleton instance of WebSocketService for use throughout the application
export const websocketService = new WebSocketService()