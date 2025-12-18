// Import React hooks and types
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// Import type definitions for User and AuthResponse
import type { User, AuthResponse } from '../types'
// Import authentication service for API calls
import { authService } from '../services/authService'
// Import toast notification library for user feedback
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
        setUser(JSON.parse(storedUser))
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
  // @param email - User's email address
  // @param password - User's password
  // @throws Error if login fails
  const login = async (email: string, password: string) => {
    try {
      // Call the authentication service to log in
      const response: AuthResponse = await authService.login({ email, password })
      
      // Extract user data from the response
      const userData: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        city: response.city,
      }
      
      // Update state with the authenticated user
      setUser(userData)
      // Store user data and token in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', response.token)
      
      // Show success notification to the user
      toast.success('Login successful!')
    } catch (error: any) {
      // Extract error message from response or use default message
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.'
      // Show error notification to the user
      toast.error(errorMessage)
      // Re-throw error so calling code can handle it if needed
      throw error
    }
  }

  // Register function: creates a new user account
  // @param data - Registration data including name, email, password, role, etc.
  // @throws Error if registration fails
  const register = async (data: {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
    role: 'USER' | 'PROVIDER' | 'ADMIN'
  }) => {
    try {
      // Call the authentication service to register a new user
      const response: AuthResponse = await authService.register(data)
      
      // Extract user data from the response
      const userData: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        city: response.city,
      }
      
      // Update state with the newly registered user
      setUser(userData)
      // Store user data and token in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', response.token)
      
      // Show success notification to the user
      toast.success('Registration successful!')
    } catch (error: any) {
      // Extract error message from response or use default message
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.'
      // Show error notification to the user
      toast.error(errorMessage)
      // Re-throw error so calling code can handle it if needed
      throw error
    }
  }

  // Logout function: clears the current user session
  const logout = () => {
    // Clear user from state
    setUser(null)
    // Remove user data and token from localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Show success notification to the user
    toast.success('Logged out successfully')
  }

  // Update user function: updates the current user data
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    // Update the user state
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
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