import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageLoadingSkeleton } from './ui/Loader'

interface AdminRouteProps {
  children: ReactNode
}

// Route guard for ADMIN role
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
