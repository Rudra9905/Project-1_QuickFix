import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from './ui/Loader'

// Route guard that blocks access for unauthenticated users
interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while auth status is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  // Redirect unauthenticated users to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Render protected content when authenticated
  return <>{children}</>
}
