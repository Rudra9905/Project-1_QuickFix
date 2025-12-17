// Import axios library for making HTTP requests
import axios from 'axios'

// Determine the API base URL based on environment variables
// Use relative URL in development (via Vite proxy) or absolute URL from env
// Falls back to localhost:8080/api if no environment variable is set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8080/api')

// Create an axios instance with default configuration
// This instance will be used for all API calls throughout the application
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // Set the base URL for all requests
  headers: {
    'Content-Type': 'application/json', // Set default content type to JSON
  },
})

// Request interceptor: runs before every HTTP request
// Purpose: Automatically add authentication token to request headers
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the JWT token from browser's local storage
    const token = localStorage.getItem('token')
    // Only add token if it exists and is not a placeholder value
    // This prevents sending invalid tokens to the server
    if (token && token !== 'token-placeholder') {
      // Add the token to the Authorization header using Bearer token format
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // If there's an error in the request interceptor, reject the promise
    return Promise.reject(error)
  }
)

// Response interceptor: runs after every HTTP response
// Purpose: Handle global error responses, especially authentication errors
apiClient.interceptors.response.use(
  (response) => response, // If response is successful, return it as-is
  (error) => {
    // Check if the error is a 401 Unauthorized status
    // This typically means the user's session has expired or token is invalid
    if (error.response?.status === 401) {
      // Clear authentication data from local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirect user to login page to re-authenticate
      window.location.href = '/login'
    }
    // Reject the promise with the error so calling code can handle it
    return Promise.reject(error)
  }
)
