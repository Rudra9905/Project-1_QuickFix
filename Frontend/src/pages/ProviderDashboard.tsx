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
  CalendarIcon,
} from '../components/icons/CustomIcons'
import { format, parseISO, isToday, min, max } from 'date-fns'

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

// Helper structure for grouped bookings
interface BookingGroup {
  id: string // composite id
  isGroup: true
  bookings: Booking[]
  user: User
  serviceType: string
  note?: string
  totalPrice?: number
  earliestDate: Date | null
  latestDate: Date | null
  createdAt: string
}

// Helper function to extract price from booking note
const extractPriceFromNote = (note?: string): number | null => {
  if (!note) return null
  // Match patterns like "₹500" or "- ₹500/" in the note
  const match = note.match(/₹(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

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
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [user.id])

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

  // Batch Accept
  const handleBatchAccept = async (bookingIds: number[]) => {
    // Optimistic update all
    bookingIds.forEach(id => optimisticUpdateStatus(id, 'ACCEPTED'))
    try {
      // Process sequentially to ensure all are accepted
      // In a real optimized backend, we'd have a batch-accept endpoint
      await Promise.all(bookingIds.map(id => bookingService.acceptBooking(id)))
      toast.success(`Accepted package of ${bookingIds.length} bookings!`)
      fetchData()
    } catch (error: any) {
      toast.error('Failed to accept some bookings in the package')
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

  // Batch Reject
  const handleBatchReject = async (bookingIds: number[]) => {
    bookingIds.forEach(id => optimisticUpdateStatus(id, 'REJECTED'))
    try {
      await Promise.all(bookingIds.map(id => bookingService.rejectBooking(id)))
      toast.success('Package declined')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to decline some bookings')
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
      navigate('/provider-setup')
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
  // Note: For stats, we count individual bookings
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

  // --- Grouping Logic Helper ---
  const groupBookings = (list: Booking[], sortForDistance: boolean) => {
    const groups: (Booking | BookingGroup)[] = []
    const processedIds = new Set<number>()

    // Sort by recent first initially
    const sortedRaw = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    sortedRaw.forEach(booking => {
      if (processedIds.has(booking.id)) return

      // Check if this is a "Multiple Booking Package"
      if (booking.note === 'Multiple Booking Package') {
        const peers = sortedRaw.filter(b =>
          !processedIds.has(b.id) &&
          b.user.id === booking.user.id &&
          b.serviceType === booking.serviceType &&
          b.note === 'Multiple Booking Package'
        )

        if (peers.length > 1) {
          const dates = peers
            .map(b => new Date(b.bookingDate || ''))
            .filter(d => !isNaN(d.getTime()))

          // Determine status for the group
          // For accepted group, we consider it efficient to track if any are still not completed?
          // Or just group them.

          const group: BookingGroup = {
            id: `group-${peers[0].id}`,
            isGroup: true,
            bookings: peers,
            user: booking.user,
            serviceType: booking.serviceType,
            note: booking.note,
            earliestDate: dates.length > 0 ? min(dates) : null,
            latestDate: dates.length > 0 ? max(dates) : null,
            createdAt: booking.createdAt,
          }
          groups.push(group)
          peers.forEach(p => processedIds.add(p.id))
          return
        }
      }

      groups.push(booking)
      processedIds.add(booking.id)
    })

    return groups.sort((a, b) => {
      if (sortForDistance && activeJobTab === 'nearby') {
        const bA = (a as BookingGroup).isGroup ? (a as BookingGroup).bookings[0] : (a as Booking)
        const bB = (b as BookingGroup).isGroup ? (b as BookingGroup).bookings[0] : (b as Booking)
        const dA = calculateDistanceKm(bA) ?? 9999
        const dB = calculateDistanceKm(bB) ?? 9999
        return dA - dB
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  const availableGroups = useMemo(() => groupBookings(availableJobs, true), [availableJobs, activeJobTab, providerProfile])

  // Filter accepted jobs that are NOT completed
  const acceptedJobsList = bookings.filter(b => b.status === 'ACCEPTED')
  const upcomingGroups = useMemo(() => groupBookings(acceptedJobsList, false), [acceptedJobsList])

  // Get service icon and color
  const getServiceInfo = (serviceType: string) => {
    return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
  }

  const estimateDurationMinutes = (booking: Booking) => {
    const variable = booking.note ? Math.min(90, Math.ceil(booking.note.length / 40) * 10) : 0
    return 30 + variable
  }

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

  // Calculate remaining time for request
  const getRemainingTime = (createdAt: string) => {
    const expiresAt = new Date(createdAt).getTime() + 2 * 60 * 1000 // 2 minutes
    const diff = expiresAt - nowTick

    if (diff <= 0) return null

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Render Helper for Job/Group Card
  const renderJobCard = (item: Booking | BookingGroup, isAccepted: boolean) => {
    const isGroup = (item as BookingGroup).isGroup
    const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
    const group = isGroup ? (item as BookingGroup) : null

    const serviceInfo = getServiceInfo(booking.serviceType)
    const ServiceIcon = serviceInfo.icon
    const price = extractPriceFromNote(booking.note) || providerProfile?.basePrice
    const distance = calculateDistanceKm(booking)
    const estimatedMinutes = estimateDurationMinutes(booking)

    // Dynamic Styles based on Service Color
    const borderColor = isGroup ? serviceInfo.color : '#e2e8f0' // slate-200
    const bgColor = isGroup ? `${serviceInfo.color}08` : '#ffffff' // 5% opacity
    const badgeColor = serviceInfo.color

    return (
      <div
        key={isGroup ? group!.id : booking.id}
        className="bg-card rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all relative overflow-hidden mb-4"
        style={{
          borderColor: isGroup ? `${borderColor}50` : borderColor,
          backgroundColor: bgColor
        }}
      >
        {/* Group Indicator Strip */}
        {isGroup && (
          <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: badgeColor }}></div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
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
                {isGroup && (
                  <span
                    className="text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: badgeColor }}
                  >
                    Package ({group!.bookings.length})
                  </span>
                )}
              </div>

              <p className="text-sm text-text-muted flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-base">location_on</span>
                {distance != null ? `${distance} km away` : booking.user.city ? `In ${booking.user.city}` : 'Location pending'} • {booking.user.city || 'Address pending'}
              </p>

              {/* Date Display */}
              {isGroup ? (
                <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: serviceInfo.color }}>
                  <CalendarIcon size={16} color={serviceInfo.color} />
                  <span>
                    {group!.earliestDate && group!.latestDate
                      ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
                      : 'Dates Pending'}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 mb-1">
                  Request Date: {(() => {
                    const d = new Date(booking.bookingDate || '');
                    return !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : 'Date pending';
                  })()}
                </div>
              )}

              <p className="text-sm text-text-dark line-clamp-2">
                {booking.note || 'No additional details provided.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between gap-4 min-w-[120px]">
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: serviceInfo.color }}>
                {isGroup ? 'Package Deal' : (price != null ? `₹${price.toLocaleString()}` : 'Not set')}
              </p>
              <p className="text-xs text-text-muted">
                {isGroup ? `${group!.bookings.length} x Daily Service` : `Est. ${estimatedMinutes} mins`}
              </p>
            </div>

            {!isAccepted ? (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {(() => {
                  const remaining = getRemainingTime(booking.createdAt)
                  const isExpired = !remaining

                  return (
                    <>
                      {!isExpired && (
                        <div className="text-right mb-1">
                          <span className={`text-sm font-bold ${remaining.includes('0:0') || remaining.startsWith('0:') && parseInt(remaining.split(':')[1]) < 30
                              ? 'text-red-600 animate-pulse'
                              : 'text-primary'
                            }`}>
                            Expires in: {remaining}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => isGroup ? handleBatchReject(group!.bookings.map(b => b.id)) : handleReject(booking.id)}
                          className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
                        >
                          Decline {isGroup && 'All'}
                        </button>
                        <button
                          onClick={() => isGroup ? handleBatchAccept(group!.bookings.map(b => b.id)) : handleAccept(booking.id)}
                          disabled={isExpired}
                          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-primary/20 ${isExpired ? 'bg-gray-400 cursor-not-allowed' : ''
                            }`}
                          style={{ backgroundColor: isExpired ? undefined : serviceInfo.color }}
                        >
                          {isExpired ? 'Expired' : `Accept ${isGroup ? 'All' : ''}`}
                        </button>
                      </div>
                    </>
                  )
                })()}

              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-medium">
                  Accepted
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }


  // ... (Rest of component) ...

  const firstName = user.name.split(' ')[0]

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome & Stats Section */}
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

        {/* Stats Cards ... (Keep existing stats code) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ... Paste existing stats cards here for brevity in diff ... */}
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

      {/* Scheduled / Upcoming Section */}
      {upcomingGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-dark mb-4">Scheduled & Active Jobs</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {upcomingGroups.map(item => renderJobCard(item, true))}
          </div>
        </div>
      )}

      {/* Available jobs section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-dark">Available Jobs</h2>
            <div className="flex gap-2">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${activeJobTab === 'nearby'
                  ? 'text-primary hover:bg-primary/5'
                  : 'text-text-muted hover:bg-slate-100'
                  }`}
                onClick={() => setActiveJobTab('nearby')}
              >
                Nearby
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${activeJobTab === 'recent'
                  ? 'text-primary hover:bg-primary/5'
                  : 'text-text-muted hover:bg-slate-100'
                  }`}
                onClick={() => setActiveJobTab('recent')}
              >
                Recent
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {availableGroups.length > 0 ? (
              availableGroups.map(item => renderJobCard(item, false))
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
          {/* Status Card and InProgressJob logic ... keeping it as is, or maybe removing InProgressJob from sidebar if it's now in Scheduled? 
                  For now, let's keep it as a 'Quick Focus' for the *immediate* job, while 'Scheduled' shows the overview. 
              */}
          {providerProfile && (
            /* ... Existing Status Card ... */
            <div className="bg-card rounded-3xl p-6 border border-slate-100 shadow-sm">
              {/* ... content ... */}
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
                className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${providerProfile.isAvailable
                  ? 'bg-warning/10 text-warning hover:bg-warning/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
                  } ${!providerProfile.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {providerProfile.isAvailable ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          )}

          {inProgressJob && (
            /* ... Existing InProgress Card ... */
            <div className="bg-primary text-white rounded-3xl p-6 shadow-lg">
              {/* ... existing content ... */}
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