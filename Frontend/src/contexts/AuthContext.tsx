// Import React hooks and types
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// Import type definitions for User and AuthResponse
import type { User, AuthResponse } from '../types'
// Import authentication service for API calls
import { authService } from '../services/authService'
// Import toast notification library for user feedback
// Import user service for fetching user data
import { userService } from '../services/userService'
import toast from 'react-hot-toast'

// AuthContextType interface: defines the shape of the authentication context
interface AuthContextType {
  user: User | null // Current authenticated user, or null if not logged in
  isLoading: boolean // Whether authentication state is being loaded
  login: (email: string, password: string) => Promise<void> // Function to log in a user
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
    role: 'USER' | 'PROVIDER' | 'ADMIN'
  }) => Promise<void> // Function to register a new user
  logout: () => void // Function to log out the current user
  isAuthenticated: boolean // Boolean indicating if user is authenticated
  updateUser: (userData: Partial<User>) => void // Function to update user data
  fetchUser: () => Promise<void> // Function to refresh user data
}

// Create the authentication context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider component: provides authentication context to the entire application
// @param children - React components that will have access to the auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State to store the current authenticated user
  const [user, setUser] = useState<User | null>(null)
  // State to track if authentication data is being loaded from localStorage
  const [isLoading, setIsLoading] = useState(true)

  // Effect hook: runs once on component mount to restore user session from localStorage
  useEffect(() => {
    // Retrieve stored user data and token from browser's local storage
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    // If both user data and token exist, try to restore the session
    if (storedUser && storedToken) {
      try {
        // Parse the stored user JSON and set it as the current user
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser)
        } else {
          // Invalid user data
          throw new Error('Invalid session data')
        }
      } catch (error) {
        // If parsing fails (corrupted data), clear the invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    // Mark loading as complete after attempting to restore session
    setIsLoading(false)
  }, []) // Empty dependency array means this runs only once on mount

  // Login function: authenticates a user with email and password
  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authService.login({ email, password })
      const userData: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        city: response.city,
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', response.token)
      toast.success('Login successful!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.'
      toast.error(errorMessage)
      throw error
    }
  }

  // Register function: creates a new user account
  const register = async (data: {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
    role: 'USER' | 'PROVIDER' | 'ADMIN'
  }) => {
    try {
      const response: AuthResponse = await authService.register(data)
      const userData: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        city: response.city,
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', response.token)
      toast.success('Registration successful!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.'
      toast.error(errorMessage)
      throw error
    }
  }

  // Logout function: clears the current user session
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
  }

  // Update user function: updates the current user data
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  // Fetch updated user data from server
  const fetchUser = async () => {
    if (!user) return
    try {
      // Refresh user data from backend
      const updatedUser = await userService.getUserById(user.id)

      // Merge with existing session data to preserve tokens/flags if any (though backend should be source of truth)
      const mergedUser = { ...user, ...updatedUser }

      setUser(mergedUser)
      localStorage.setItem('user', JSON.stringify(mergedUser))
    } catch (error) {
      console.error('Failed to refresh user data', error)
      // Don't toast here as it might be background refresh
    }
  }

  // Render the context provider with all authentication-related values
  return (
    <AuthContext.Provider
      value={{
        user, // Current user object
        isLoading, // Loading state
        login, // Login function
        register, // Register function
        logout, // Logout function
        isAuthenticated: !!user, // Boolean: true if user exists, false otherwise
        updateUser, // Update user function
        fetchUser, // Fetch user function
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// useAuth hook: custom hook to access the authentication context
// This hook must be used within an AuthProvider component
// @returns The authentication context value
// @throws Error if used outside of AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext)
  // Ensure the hook is used within the provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}