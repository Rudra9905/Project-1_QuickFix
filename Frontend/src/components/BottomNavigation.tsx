import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, CalendarIcon, UserIcon } from './icons/CustomIcons'

// Mobile bottom navigation bar for quick access to main sections
export const BottomNavigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: HomeIcon },
    { path: '/bookings', label: 'Bookings', icon: CalendarIcon },
    { path: '/profile', label: 'Account', icon: UserIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-border z-50 lg:hidden shadow-medium">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname === '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <Icon size={24} color={isActive ? '#5B2D8B' : '#9CA3AF'} />
              <span className={`text-helper mt-1 ${isActive ? 'font-label' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
