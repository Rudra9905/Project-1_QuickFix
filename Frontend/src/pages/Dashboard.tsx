import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { DashboardSkeleton } from '../components/ui/Loader'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types'
import { isToday } from 'date-fns'
import { ProviderDashboard } from './ProviderDashboard'


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
  const [isLoading, setIsLoading] = useState(true)
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [trackingStatus] = useState<TrackingStatus>('on_the_way')

  // Redirect admins to the admin dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    }
  }, [user?.role, navigate])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        if (user.role === 'USER') {
          const bookings = await bookingService.getBookingsByUser(user.id)

          // Find active booking (ACCEPTED or IN_PROGRESS status)
          // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
          const active = bookings.find(b =>
            b.status === 'IN_PROGRESS' ||
            (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
          )
          setActiveBooking(active || null)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  /* Auto-refresh on booking-related notifications */
  const { notifications } = useNotifications()
  const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      // Check if this is a new notification we haven't processed yet
      if (latest.id !== lastProcessedNotificationId) {
        // Check if it's a booking-related notification
        const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
          latest.message.toLowerCase().includes('booking') ||
          latest.message.toLowerCase().includes('job') ||
          latest.title.toLowerCase().includes('request') ||
          latest.title.toLowerCase().includes('accepted') ||
          latest.title.toLowerCase().includes('rejected') ||
          latest.title.toLowerCase().includes('cancelled') ||
          latest.title.toLowerCase().includes('completed')

        if (isBookingRelated) {
          console.log('New booking notification received, refreshing dashboard...', latest.id)
          const fetchData = async () => {
            if (!user) return
            try {
              if (user.role === 'USER') {
                const bookings = await bookingService.getBookingsByUser(user.id)

                // Find active booking (ACCEPTED or IN_PROGRESS status)
                // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
                const active = bookings.find(b =>
                  b.status === 'IN_PROGRESS' ||
                  (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
                )
                setActiveBooking(active || null)
              }
            } catch (error) {
              console.error('Failed to fetch data:', error)
            }
          }
          fetchData()
          setLastProcessedNotificationId(latest.id)
        }
      }
    }
  }, [notifications])

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
    if (type === 'single') {
      navigate('/providers')
    } else {
      navigate('/select-provider', { state: { bookingType: type } })
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (user?.role === 'PROVIDER') {
    // Render ProviderDashboard for providers
    return <ProviderDashboard user={user as any} />
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
          className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-12 text-center shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-64"
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
          className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-12 text-center shadow-sm border border-slate-100 hover:border-accent-teal/30 hover:shadow-md transition-all cursor-pointer h-64"
          onClick={() => navigate('/book/multiple-dates')}
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



      {/* Active Service */}
      {activeBooking && (
        <div className="bg-primary rounded-3xl p-6 md:p-8 relative overflow-hidden">
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
              onClick={() => navigate(`/track-service/${activeBooking.id}`)}
            >
              Track Service
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20">
            <span className="material-symbols-outlined text-[120px] text-white">location_on</span>
          </div>
        </div>
      )}


    </div>
  )
}