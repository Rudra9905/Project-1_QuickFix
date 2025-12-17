import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { bookingService } from '../../services/bookingService'

type SidebarItem = {
  path: string
  label: string
  icon: string
  badge?: boolean
}

// Provider menu items
const providerMenuItems: SidebarItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/earnings', label: 'Earnings', icon: 'payments' },
  { path: '/bookings', label: 'Bookings', icon: 'calendar_month' },
  { path: '/profile', label: 'Profile', icon: 'group' },
]// User menu items
const userMenuItems: SidebarItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/providers', label: 'Providers', icon: 'group' },
  { path: '/bookings', label: 'Bookings', icon: 'calendar_month' },
  { path: '/profile', label: 'Settings', icon: 'settings' },
]

export const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0)

  useEffect(() => {
    if (user?.role === 'PROVIDER') {
      // Fetch pending bookings count for badge
      bookingService.getBookingsByProvider(user.id)
        .then(bookingsData => {
          const pending = bookingsData.filter(b => b.status === 'REQUESTED').length
          setPendingBookingsCount(pending)
        })
        .catch(() => {})
    }
  }, [user])

  // Get menu items based on user role
  const menuItems = user?.role === 'PROVIDER' ? providerMenuItems : userMenuItems

  // Filter menu items based on user role
  const filteredItems = menuItems.filter((item) => {
    if (user?.role === 'PROVIDER') {
      // Show all provider menu items
      return true
    }
    // User menu items
    if (item.path === '/providers' && user?.role === 'USER') {
      return true
    }
    if (item.path === '/bookings') {
      return true
    }
    if (item.path === '/dashboard' || item.path === '/profile') {
      return true
    }
    return false
  })

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-5 left-4 z-50 p-2 bg-card rounded-xl shadow-sm border border-slate-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <span className="material-symbols-outlined text-primary">menu</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out z-30 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="flex-1 space-y-2 px-4 py-6">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-muted hover:bg-surface hover:text-text-dark'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {'badge' in item && item.badge && pendingBookingsCount > 0 && (
                  <span className="ml-auto bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingBookingsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Need Help Section */}
        <div className="px-4 pb-6">
          <div className="rounded-2xl bg-surface p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-white flex items-center justify-center text-accent-orange shadow-sm">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-dark">Need Help?</p>
                <p className="text-[10px] text-text-muted">Contact Support</p>
              </div>
            </div>
            <button className="w-full rounded-lg bg-text-dark py-2 text-xs font-medium text-white hover:bg-primary transition-colors">
              Get Assistance
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}