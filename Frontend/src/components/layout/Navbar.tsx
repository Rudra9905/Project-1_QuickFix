import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { useState, useEffect } from 'react'
import { NotificationBell } from '../NotificationBell'

interface NavbarProps {
  onEditAddress?: () => void
  address?: string
}

export const Navbar = ({ onEditAddress, address }: NavbarProps) => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-400/30 bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] h-16 shrink-0 shadow-md">
      <div className="flex items-center justify-between h-full px-4 md:px-6 w-full">
        <Link to="/dashboard" className="flex items-center gap-3 text-white">
          <div className="size-8 text-white">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_6_319)">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
              </g>
              <defs>
                <clipPath id="clip0_6_319"><rect fill="white" height="48" width="48"></rect></clipPath>
              </defs>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">QuickFix</h2>
        </Link>

        {/* Address field for users and providers */}
        {user && (user.role === 'USER' || user.role === 'PROVIDER') && (
          <div
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm border border-white/30 cursor-pointer hover:bg-white/30 transition-colors max-w-md w-full mx-4"
            onClick={onEditAddress}
          >
            <span className="material-symbols-outlined text-white text-lg">location_on</span>
            <span>{address || 'Click to set address'}</span>
          </div>
        )}

        {user && (
          <div className="flex items-center justify-end gap-6 flex-1">
            <NotificationBell />
            <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-white/30">
              <div className="size-8 rounded-full bg-white text-[#7C3AED] flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-white">
                {user.name?.split(' ')[0] || user.name}
              </span>
            </div>
            <div className="md:hidden text-white ml-4">
              <span className="material-symbols-outlined">menu</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}