import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from '../components/ui/Loader'
import { bookingService } from '../services/bookingService'
import type { Booking, ServiceType } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { TrackingModal } from '../components/TrackingModal'
import { useNotifications } from '../contexts/NotificationContext'
import { ProviderDashboard } from './ProviderDashboard'

const POPULAR_SERVICES: { value: ServiceType; label: string; icon: string; color: string }[] = [
  { value: 'CLEANER', label: 'Cleaning', icon: 'cleaning_services', color: 'blue' },
  { value: 'PLUMBER', label: 'Plumbing', icon: 'water_drop', color: 'orange' },
  { value: 'ELECTRICIAN', label: 'Electrical', icon: 'bolt', color: 'yellow' },
  { value: 'LAUNDRY', label: 'Laundry', icon: 'local_laundry_service', color: 'teal' },
  { value: 'OTHER', label: 'Other', icon: 'more_horiz', color: 'cyan' },
]

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

export const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications } = useNotifications()
  const [isLoading, setIsLoading] = useState(true)
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('on_the_way')

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        if (user.role === 'USER') {
          const bookings = await bookingService.getBookingsByUser(user.id)
          // Find active booking (ACCEPTED status)
          const active = bookings.find(b => b.status === 'ACCEPTED')
          setActiveBooking(active || null)
          
          // Get recent bookings (last 30 days, completed or accepted)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const recent = bookings
            .filter(b => {
              const bookingDate = new Date(b.createdAt)
              return bookingDate >= thirtyDaysAgo && (b.status === 'COMPLETED' || b.status === 'ACCEPTED')
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
          setRecentBookings(recent)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Refresh active booking periodically for real-time updates
    const refreshInterval = setInterval(() => {
      if (user?.role === 'USER' && activeBooking) {
        fetchData()
      }
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(refreshInterval)
  }, [user, activeBooking?.id])

  // Listen for notifications to update tracking status
  useEffect(() => {
    if (!activeBooking) return

    const relatedNotifications = notifications.filter(
      n => n.relatedBookingId === activeBooking.id && !n.isRead
    )

    // Check for status-related notifications
    relatedNotifications.forEach(notification => {
      const message = notification.message.toLowerCase()
      if (message.includes('on the way') || message.includes('heading')) {
        setTrackingStatus('on_the_way')
      } else if (message.includes('reached') || message.includes('arrived')) {
        setTrackingStatus('reached')
      }
    })
  }, [notifications, activeBooking])

  // Simulate status progression (in real app, this would come from location updates)
  useEffect(() => {
    if (!activeBooking || trackingStatus === 'arrived') return

    const statusInterval = setInterval(() => {
      // Simulate status progression based on time elapsed
      const elapsed = new Date().getTime() - new Date(activeBooking.acceptedAt || activeBooking.createdAt).getTime()
      const minutesElapsed = elapsed / (1000 * 60)

      if (minutesElapsed > 15 && trackingStatus === 'on_the_way') {
        setTrackingStatus('reached')
      } else if (minutesElapsed > 20 && trackingStatus === 'reached') {
        setTrackingStatus('arrived')
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(statusInterval)
  }, [activeBooking, trackingStatus])

  const getStatusText = () => {
    if (!activeBooking) return 'No active service'
    
    switch (trackingStatus) {
      case 'on_the_way':
        return `${activeBooking.provider.name.split(' ')[0]} is on the way.`
      case 'reached':
        return `${activeBooking.provider.name.split(' ')[0]} has reached your location.`
      case 'arrived':
        return `${activeBooking.provider.name.split(' ')[0]} has arrived.`
      default:
        return `${activeBooking.provider.name.split(' ')[0]} is on the way.`
    }
  }

  const handleBookingTypeClick = (type: 'single' | 'multiple') => {
    navigate('/select-provider', { state: { bookingType: type } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (user?.role === 'PROVIDER') {
    // Render ProviderDashboard for providers
    return <ProviderDashboard user={user} />
  }

  // Customer Dashboard - Premium Design
  return (
    <div className="flex flex-col gap-8">
      {/* Greeting Section */}
      <div>
        <p className="text-sm font-medium text-text-muted mb-1">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">
          What do you need help with today?
        </h1>
      </div>

      {/* Booking Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-10 text-center shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-64"
          onClick={() => handleBookingTypeClick('single')}
        >
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl">schedule</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-dark mb-1">Single Booking</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto">Book a one-time service for a quick fix.</p>
          </div>
          <div className="mt-4 size-8 rounded-full border border-slate-200 flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </div>
        </div>
        
        <div 
          className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-10 text-center shadow-sm border border-slate-100 hover:border-accent-teal/30 hover:shadow-md transition-all cursor-pointer h-64"
          onClick={() => handleBookingTypeClick('multiple')}
        >
          <div className="size-14 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal mb-2 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-3xl">calendar_view_month</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-dark mb-1">Multiple Booking</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto">Create a package for full house maintenance.</p>
          </div>
          <div className="mt-4 size-8 rounded-full border border-slate-200 flex items-center justify-center text-text-muted group-hover:bg-accent-teal group-hover:border-accent-teal group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-dark">Services</h2>
          <a 
            className="text-sm font-medium text-primary hover:text-primary-light transition-colors" 
            href="#"
            onClick={(e) => {
              e.preventDefault()
              navigate('/providers')
            }}
          >
            View All
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_SERVICES.map((service, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card p-8 border border-slate-100 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => navigate('/select-provider', { state: { serviceType: service.value } })}
            >
              <div className={`size-12 rounded-xl flex items-center justify-center mb-1 group-hover:bg-${service.color}-100 transition-colors bg-${service.color}-50 text-${service.color}-600`}>
                <span className="material-symbols-outlined">{service.icon}</span>
              </div>
              <h3 className="font-medium text-text-dark">{service.label}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Active Service */}
      {activeBooking && (
        <div className="bg-primary rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white text-xl font-bold mb-2">Active Service</h3>
            <p className="text-white/80 text-sm mb-6">{getStatusText()}</p>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 w-fit">
              <div className="size-10 rounded-full bg-white overflow-hidden flex items-center justify-center">
                <span className="text-primary font-bold">
                  {activeBooking.provider.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{activeBooking.provider.name}</p>
                <p className="text-white/70 text-xs">Professional</p>
              </div>
            </div>
            <button 
              className="mt-6 rounded-lg bg-white py-2 px-4 text-sm font-medium text-primary hover:bg-primary-light transition-colors"
              onClick={() => setIsTrackingModalOpen(true)}
            >
              Track Service
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20">
            <span className="material-symbols-outlined text-[120px] text-white">location_on</span>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {activeBooking && (
        <TrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          booking={activeBooking}
        />
      )}
    </div>
  )
}