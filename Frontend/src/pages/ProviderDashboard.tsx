import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from '../components/ui/Loader'
import { Button } from '../components/ui/Button'
import { TrackingModal } from '../components/TrackingModal'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import toast from 'react-hot-toast'
import type { Booking, ProviderProfile, User } from '../types'
import {
  ClockIcon,
  UserIcon,
  CleaningIcon,
  PlumbingIcon,
  LightningIcon,
  MapPinIcon,
  PhoneIcon,
  MessageIcon,
  NavigationIcon,
} from '../components/icons/CustomIcons'
import { format, parseISO, isToday } from 'date-fns'

const SERVICE_MAPPING: Record<string, { label: string; icon: any; color: string }> = {
  CLEANER: { label: 'Cleaning', icon: CleaningIcon, color: '#3B82F6' },
  PLUMBER: { label: 'Plumbing', icon: PlumbingIcon, color: '#F97316' },
  ELECTRICIAN: { label: 'Electrical', icon: LightningIcon, color: '#FCD34D' },
  LAUNDRY: { label: 'Laundry', icon: CleaningIcon, color: '#3B82F6' },
  OTHER: { label: 'Other', icon: PlumbingIcon, color: '#F97316' },
}

interface ProviderDashboardProps {
  user: User
}

type JobTab = 'nearby' | 'recent'

export const ProviderDashboard = ({ user }: ProviderDashboardProps) => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
  const [activeJobTab, setActiveJobTab] = useState<JobTab>('nearby')
  const [nowTick, setNowTick] = useState(Date.now())
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)

  useEffect(() => {
    fetchData(true)
    
    // Refresh data periodically for real-time updates
    const interval = setInterval(() => {
      fetchData()
    }, 15000) // Every 15 seconds

    return () => clearInterval(interval)
  }, [user.id])

  useEffect(() => {
    // keep the live timer fresh for in-progress jobs
    const timer = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true)
      }
      const [bookingsData, providerData] = await Promise.all([
        bookingService.getBookingsByProvider(user.id),
        providerService.getProviderByUserId(user.id),
      ])

      setBookings(bookingsData)
      setProviderProfile(providerData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  const handleAccept = async (bookingId: number) => {
    optimisticUpdateStatus(bookingId, 'ACCEPTED')
    try {
      await bookingService.acceptBooking(bookingId)
      toast.success('Booking accepted!')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept booking')
      fetchData()
    }
  }

  const handleReject = async (bookingId: number) => {
    optimisticUpdateStatus(bookingId, 'REJECTED')
    try {
      await bookingService.rejectBooking(bookingId)
      toast.success('Booking rejected')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject booking')
      fetchData()
    }
  }

  const handleComplete = async (bookingId: number) => {
    optimisticUpdateStatus(bookingId, 'COMPLETED')
    try {
      await bookingService.completeBooking(bookingId)
      toast.success('Booking completed!')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete booking')
      fetchData()
    }
  }

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    if (!providerProfile) {
      toast.error('Please create a provider profile first')
      navigate('/create-provider-profile')
      return
    }

    // Check if provider is approved
    if (!providerProfile.isApproved) {
      toast.error('Your provider profile is pending approval')
      return
    }

    try {
      setIsUpdatingAvailability(true)
      const updated = await providerService.updateAvailability(providerProfile.id, {
        isAvailable,
      })
      setProviderProfile(updated)
      toast.success(isAvailable ? 'You are now online' : 'You are now offline')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update availability')
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  const optimisticUpdateStatus = (bookingId: number, status: Booking['status']) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)))
  }

  // Calculate stats
  const newRequests = bookings.filter(b => b.status === 'REQUESTED').length
  const acceptedJobs = bookings.filter(b => b.status === 'ACCEPTED').length
  const todayCompleted = bookings.filter(b => {
    if (b.status !== 'COMPLETED' || !b.completedAt) return false
    return isToday(parseISO(b.completedAt))
  }).length

  // Get available jobs (REQUESTED status)
  const availableJobs = bookings.filter(b => b.status === 'REQUESTED')

  const toRadians = (degree: number) => (degree * Math.PI) / 180

  const calculateDistanceKm = (booking: Booking) => {
    const providerLat = providerProfile?.locationLat
    const providerLng = providerProfile?.locationLng
    const bookingUser = booking.user as User & { locationLat?: number; locationLng?: number }
    if (
      providerLat == null ||
      providerLng == null ||
      bookingUser.locationLat == null ||
      bookingUser.locationLng == null
    ) {
      return null
    }
    const earthRadiusKm = 6371
    const dLat = toRadians(bookingUser.locationLat - providerLat)
    const dLng = toRadians(bookingUser.locationLng - providerLng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(providerLat)) *
        Math.cos(toRadians(bookingUser.locationLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(earthRadiusKm * c * 10) / 10
  }

  const sortedAvailableJobs = useMemo(() => {
    return [...availableJobs].sort((a, b) => {
      if (activeJobTab === 'nearby') {
        const distanceA = calculateDistanceKm(a)
        const distanceB = calculateDistanceKm(b)
        if (distanceA != null && distanceB != null) {
          return distanceA - distanceB
        }
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [availableJobs, activeJobTab, providerProfile?.locationLat, providerProfile?.locationLng])

  // Get in-progress job (ACCEPTED status)
  const inProgressJob = bookings.find(b => b.status === 'ACCEPTED')

  // Calculate time elapsed for in-progress job
  const getTimeElapsed = (booking: Booking) => {
    if (!booking.acceptedAt) return '0m'
    const elapsed = nowTick - new Date(booking.acceptedAt).getTime()
    const minutes = Math.floor(elapsed / (1000 * 60))
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const estimateDurationMinutes = (booking: Booking) => {
    const variable = booking.note ? Math.min(90, Math.ceil(booking.note.length / 40) * 10) : 0
    return 30 + variable
  }

  // Get service icon and color
  const getServiceInfo = (serviceType: string) => {
    return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  // If provider has no profile or profile is not approved, show appropriate prompt
  if (!providerProfile || !providerProfile.isApproved) {
    // If profile exists but is not approved, redirect to completion page
    if (providerProfile && providerProfile.profileStatus !== 'APPROVED') {
      navigate('/complete-provider-profile')
      return null
    }
    
    // If no profile exists, show prompt to create one
    if (!providerProfile) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-card rounded-3xl p-12 border border-slate-100 shadow-sm text-center max-w-md">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <h3 className="text-lg font-semibold text-text-dark mb-2">Create Your Provider Profile</h3>
              <p className="text-text-muted mb-4">
                You need to create a provider profile before you can start accepting job requests.
              </p>
              <button 
                className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-light transition-colors"
                onClick={() => navigate('/create-provider-profile')}
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">
              {format(new Date(), 'EEEE, d MMM')}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">
              Welcome back, {firstName}!
            </h1>
          </div>
          <button 
            className="bg-text-dark text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary transition-colors shadow-lg shadow-text-dark/20 flex items-center gap-2"
            onClick={() => navigate('/bookings')}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            View History
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-orange/30 transition-all">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">New Requests</p>
              <h3 className="text-3xl font-bold text-text-dark">{newRequests}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center text-accent-orange group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-teal/30 transition-all">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Accepted Jobs</p>
              <h3 className="text-3xl font-bold text-text-dark">{acceptedJobs}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">assignment_turned_in</span>
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Completed Today</p>
              <h3 className="text-3xl font-bold text-text-dark">{todayCompleted}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available jobs section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-dark">Available Jobs</h2>
              <div className="flex gap-2">
                <span 
                  className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeJobTab === 'nearby' 
                      ? 'text-primary hover:bg-primary/5' 
                      : 'text-text-muted hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveJobTab('nearby')}
                >
                  Nearby
                </span>
                <span 
                  className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                    activeJobTab === 'recent' 
                      ? 'text-primary hover:bg-primary/5' 
                      : 'text-text-muted hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveJobTab('recent')}
                >
                  Recent
                </span>
              </div>
            </div>

            {/* Job listings */}
            <div className="space-y-4">
                  {sortedAvailableJobs.length > 0 ? (
                    sortedAvailableJobs.map((booking) => {
                      const serviceInfo = getServiceInfo(booking.serviceType)
                      const ServiceIcon = serviceInfo.icon
                      const price = providerProfile?.basePrice
                      const distance = calculateDistanceKm(booking)
                      const estimatedMinutes = estimateDurationMinutes(booking)

                      return (
                        <div 
                          key={booking.id}
                          className="bg-card rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                              <div 
                                className="size-14 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${serviceInfo.color}15` }}
                              >
                                <ServiceIcon size={24} color={serviceInfo.color} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-text-dark text-lg">
                                    {serviceInfo.label}
                                  </h3>
                                  <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ 
                                      backgroundColor: `${serviceInfo.color}15`,
                                      color: serviceInfo.color
                                    }}
                                  >
                                    {booking.serviceType}
                                  </span>
                                </div>
                                <p className="text-sm text-text-muted flex items-center gap-1 mb-2">
                                  <span className="material-symbols-outlined text-base">location_on</span>
                                  {distance != null ? `${distance} km away` : booking.user.city ? `In ${booking.user.city}` : 'Location pending'} • {booking.user.city || 'Address pending'}
                                </p>
                                <p className="text-sm text-text-dark line-clamp-2">
                                  {booking.note || 'No additional details provided.'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between gap-4 min-w-[120px]">
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {price != null ? `₹${price.toLocaleString()}` : 'Not set'}
                                </p>
                                <p className="text-xs text-text-muted">Est. {estimatedMinutes} mins</p>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleReject(booking.id)}
                                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleAccept(booking.id)}
                                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-primary text-sm font-medium text-white hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="bg-card rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-primary text-2xl">inbox</span>
                        </div>
                        <h3 className="text-lg font-semibold text-text-dark mb-2">No New Requests</h3>
                        <p className="text-text-muted mb-4">
                          You're all caught up! New job requests will appear here when customers book services near you.
                        </p>
                        <button 
                          className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-light transition-colors"
                          onClick={() => navigate('/providers')}
                        >
                          Browse All Providers
                        </button>
                      </div>
                    </div>
                  )}
            </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Availability status card - only show if provider has a profile */}
          {providerProfile && (
                  <div className="bg-card rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-text-dark">Your Status</h3>
                      <div className={`size-3 rounded-full ${providerProfile.isAvailable ? 'bg-success' : 'bg-warning'}`}></div>
                    </div>
                    {!providerProfile.isApproved ? (
                      <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-4">
                        <p className="text-sm text-warning font-medium">Profile Pending Approval</p>
                        <p className="text-xs text-warning">Your profile is awaiting admin approval.</p>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted mb-4">
                        {providerProfile.isAvailable 
                          ? 'You are currently accepting new job requests.' 
                          : 'You are not accepting new job requests.'}
                      </p>
                    )}
                    <button
                      disabled={isUpdatingAvailability || !providerProfile.isApproved}
                      onClick={() => handleAvailabilityToggle(!providerProfile.isAvailable)}
                      className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                        providerProfile.isAvailable
                          ? 'bg-warning/10 text-warning hover:bg-warning/20'
                          : 'bg-success/10 text-success hover:bg-success/20'
                      } ${!providerProfile.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {providerProfile.isAvailable ? 'Go Offline' : 'Go Online'}
                    </button>
                  </div>
                )}

                {/* In-progress job card */}
                {inProgressJob && (
                  <div className="bg-primary text-white rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        In Progress
                      </span>
                      <span className="text-xs text-white font-medium">
                        Started {getTimeElapsed(inProgressJob)} ago
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1 text-white">
                      {getServiceInfo(inProgressJob.serviceType).label}
                    </h3>
                    <p className="text-sm text-white mb-4">
                      Customer: {inProgressJob.user.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                      <div className="rounded-xl bg-white/20 px-3 py-2 flex items-center gap-2 border border-white/30">
                        <ClockIcon size={14} color="#FFFFFF" />
                        <span className="text-white font-medium">{estimateDurationMinutes(inProgressJob)} mins est.</span>
                      </div>
                      <div className="rounded-xl bg-white/20 px-3 py-2 flex items-center gap-2 border border-white/30">
                        <MapPinIcon size={14} color="#FFFFFF" />
                        <span className="text-white font-medium">{inProgressJob.user.city || 'Location'}</span>
                      </div>
                      <div className="rounded-xl bg-white/20 px-3 py-2 flex items-center gap-2 border border-white/30">
                        <UserIcon size={14} color="#FFFFFF" />
                        <span className="text-white font-medium">{authUser?.name || 'You'}</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleComplete(inProgressJob.id)}
                      className="w-full bg-white text-primary hover:bg-white/90"
                    >
                      Complete Job
                    </Button>
                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/30 mt-4">
                      <button 
                        onClick={() => setIsTrackingModalOpen(true)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20" 
                        aria-label="Track customer location"
                      >
                        <NavigationIcon size={18} color="#FFFFFF" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20" aria-label="Call customer">
                        <PhoneIcon size={18} color="#FFFFFF" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20" aria-label="Message customer">
                        <MessageIcon size={18} color="#FFFFFF" />
                      </button>
                    </div>
                  </div>
                )}
        </div>
      </div>

      {/* Tracking Modal */}
      {inProgressJob && (
        <TrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          booking={inProgressJob}
        />
      )}
    </div>
  )
}