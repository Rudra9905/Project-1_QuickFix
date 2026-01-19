import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext' - removed
import { useNotifications } from '../contexts/NotificationContext'
import { Button } from '../components/ui/Button'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import toast from 'react-hot-toast'
import { ProviderDashboardSkeleton } from '../components/ui/Loader'
import type { Booking, ProviderProfile, User } from '../types'
import {
  ClockIcon,
  CleaningIcon,
  PlumbingIcon,
  LightningIcon,
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
  /* Timer State */
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getRemainingTime = (createdAt: string) => {
    const created = new Date(createdAt)
    const expiresAt = new Date(created.getTime() + 5 * 60 * 1000) // 5 minutes
    const diff = expiresAt.getTime() - currentDate.getTime()

    if (diff <= 0) return null

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeJobTab, setActiveJobTab] = useState<JobTab>('nearby')
  /* Persist dismissed alerts */
  const [dismissedAlertIds, setDismissedAlertIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('dismissedAlertIds')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [selectedGroup, setSelectedGroup] = useState<BookingGroup | null>(null)



  useEffect(() => {
    fetchData()

    // Poll for updates every 30 seconds to keep list fresh (e.g. handle auto-expired)
    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [user.id])

  /* Auto-refresh Logic */
  const { notifications } = useNotifications()
  const [lastProcessedId, setLastProcessedId] = useState<number | null>(null)

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      if (latest.id !== lastProcessedId) {
        // Check for relevant notification types that should trigger a refresh
        const JOB_REFRESH_TYPES = [
          'NEW_BOOKING_REQUEST',
          'BOOKING_CANCELLED',
          'JOB_ACCEPTED',
          'JOB_COMPLETED',
          'EARNINGS_CREDITED',
          // Include user types that might be relevant if roles overlap or just in case
          'BOOKING_ACCEPTED',
          'BOOKING_REJECTED'
        ];

        // Also check legacy string matching as fallback
        const isJobRelated = JOB_REFRESH_TYPES.includes(latest.type) ||
          latest.title.toLowerCase().includes('booking') ||
          latest.message.toLowerCase().includes('job');

        if (isJobRelated) {
          console.log(`Real-time update received (Type: ${latest.type}), refreshing dashboard...`, latest.id)
          fetchData() // Refresh without full loader to be less intrusive
          setLastProcessedId(latest.id)
        }
      }
    }
  }, [notifications])

  const fetchData = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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


  const handleBatchReject = async (bookingIds: number[]) => {
    bookingIds.forEach(id => optimisticUpdateStatus(id, 'REJECTED'))
    try {
      await Promise.all(bookingIds.map(id => bookingService.rejectBooking(id)))
      toast.success('Package declined')
      fetchData()
      fetchData()
    } catch (error: any) {
      toast.error('Failed to decline some bookings')
      fetchData()
    }
  }


  const handleGroupClick = (group: BookingGroup) => {
    setSelectedGroup(group)
  }

  const handleJobClick = (booking: Booking) => {
    navigate(`/provider/job/${booking.id}/track`)
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
  const acceptedJobs = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length
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
  const acceptedJobsList = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
  const upcomingGroups = useMemo(() => groupBookings(acceptedJobsList, false), [acceptedJobsList])

  // Get service icon and color
  const getServiceInfo = (serviceType: string) => {
    return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
  }

  const estimateDurationMinutes = (booking: Booking) => {
    const variable = booking.note ? Math.min(90, Math.ceil(booking.note.length / 40) * 10) : 0
    return 30 + variable
  }

  // Unused helper removed



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

    // Timer for pending single bookings
    const remainingTime = !isGroup && booking.status === 'REQUESTED' ? getRemainingTime(booking.createdAt) : null

    // Dynamic Styles based on Service Color
    const borderColor = isGroup ? serviceInfo.color : '#e2e8f0' // slate-200
    const bgColor = isGroup ? `${serviceInfo.color}08` : '#ffffff' // 5% opacity
    const badgeColor = serviceInfo.color

    return (
      <div
        key={isGroup ? group!.id : booking.id}
        className="bg-card rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all relative overflow-hidden mb-4 cursor-pointer"
        style={{
          borderColor: isGroup ? `${borderColor}50` : borderColor,
          backgroundColor: bgColor
        }}
        onClick={() => {
          if (isGroup) {
            handleGroupClick(group!)
          } else {
            handleJobClick(booking)
          }
        }}
      >
        {/* Group Indicator Strip */}
        {isGroup && (
          <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: badgeColor }}></div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
          {/* Left Content */}
          <div className="flex gap-4 flex-1 min-w-0 pr-2">
            <div
              className="size-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${serviceInfo.color}15` }}
            >
              <ServiceIcon size={24} color={serviceInfo.color} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-text-dark text-lg whitespace-nowrap">
                  {serviceInfo.label}
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: `${serviceInfo.color}15`,
                    color: serviceInfo.color
                  }}
                >
                  {booking.serviceType}
                </span>
                {isGroup && (
                  <span
                    className="text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                    style={{ backgroundColor: badgeColor }}
                  >
                    Package ({group!.bookings.length})
                  </span>
                )}
                {/* Timer Badge */}
                {remainingTime && (
                  <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    {remainingTime}
                  </span>
                )}
              </div>

              <p className="text-sm text-text-muted flex items-center gap-1 mb-2 truncate">
                <span className="material-symbols-outlined text-base shrink-0">location_on</span>
                <span className="truncate">
                  {distance != null ? `${distance} km away` : booking.user.city ? `In ${booking.user.city}` : 'Location pending'} • {booking.user.city || 'Address pending'}
                </span>
              </p>

              {/* Customer Contact - Only visible if Accepted or In Progress */}
              {(booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-base text-gray-500">person</span>
                    <span className="text-sm font-semibold text-gray-700">{booking.user.name}</span>
                  </div>
                  {booking.user.phone && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-gray-500">call</span>
                      <span className="text-sm text-gray-600">{booking.user.phone}</span>
                    </div>
                  )}
                </div>
              )}

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

              <p className="text-sm text-text-dark line-clamp-2 break-words">
                {booking.note || 'No additional details provided.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between gap-4 min-w-[140px] shrink-0">
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
                <>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        isGroup ? handleBatchReject(group!.bookings.map(b => b.id)) : handleReject(booking.id)
                      }}
                      className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        isGroup ? handleBatchAccept(group!.bookings.map(b => b.id)) : handleAccept(booking.id)
                      }}
                      className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-primary/20`}
                      style={{ backgroundColor: serviceInfo.color }}>
                      Accept {isGroup ? 'All' : ''}
                    </button>
                  </div>
                </>
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Are you sure you want to cancel this job? This will trigger a full refund to the user.')) {
                      bookingService.cancelBooking(booking.id)
                        .then(() => {
                          toast.success('Job cancelled and refunded')
                          fetchData()
                        })
                        .catch((err) => {
                          console.error(err)
                          toast.error('Failed to cancel job')
                        })
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
                {(!booking.startedAt && booking.status === 'IN_PROGRESS') || booking.status === 'ACCEPTED' ? (
                  isGroup ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGroupClick(group!)
                      }}
                      className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      View
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJobClick(booking)
                      }}
                      className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      View
                    </button>
                  )
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleComplete(booking.id)
                    }}
                    className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg shadow-green-600/25 hover:bg-green-500 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Complete Job
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }


  // ... (Rest of component) ...

  const firstName = user.name.split(' ')[0]

  if (loading) {
    return <ProviderDashboardSkeleton />
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Critical Alerts Section */}
      {(() => {
        const criticalCancellations = bookings.filter(b =>
          (b.status === 'CANCELLED' || b.status === 'REJECTED') &&
          (b.bookingDate && (isToday(new Date(b.bookingDate)) || new Date(b.bookingDate) > new Date())) &&
          !dismissedAlertIds.includes(b.id)
        )

        if (criticalCancellations.length === 0) return null

        const handleDismiss = () => {
          const idsToDismiss = criticalCancellations.map(b => b.id)
          const newDismissed = [...dismissedAlertIds, ...idsToDismiss]
          setDismissedAlertIds(newDismissed)
          localStorage.setItem('dismissedAlertIds', JSON.stringify(newDismissed))
        }

        return (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <span className="material-symbols-outlined text-red-600">warning</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-red-900 font-bold text-lg mb-1">Attention Required</h3>
                    <p className="text-red-700 text-sm mb-3">
                      {criticalCancellations.length} upcoming job{criticalCancellations.length > 1 ? 's have' : ' has'} been cancelled or declined recently.
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Okay
                  </button>
                </div>
                <div className="space-y-2">
                  {criticalCancellations.map(job => (
                    <div key={job.id} className="bg-white/60 p-3 rounded-lg flex items-center justify-between border border-red-100">
                      <div>
                        <p className="text-red-900 font-medium text-sm">
                          {job.serviceType} for {job.user.name}
                        </p>
                        <p className="text-red-500 text-xs">
                          Was scheduled for: {job.bookingDate ? format(new Date(job.bookingDate), 'MMM d, yyyy') : 'Pending Date'}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
          {providerProfile && (
            <div className="bg-card rounded-2xl p-4 border border-slate-100 shadow-sm min-w-[300px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-text-dark text-sm">Your Status</h3>
                <div className={`size-2.5 rounded-full ${providerProfile.isAvailable ? 'bg-success' : 'bg-warning'}`}></div>
              </div>
              <p className="text-xs text-text-muted mb-3">
                {providerProfile.isAvailable
                  ? 'Accepting jobs'
                  : 'Not accepting jobs'}
              </p>
              <button
                disabled={isUpdatingAvailability || !providerProfile.isApproved}
                onClick={() => handleAvailabilityToggle(!providerProfile.isAvailable)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${providerProfile.isAvailable
                  ? 'bg-warning/10 text-warning hover:bg-warning/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
                  } ${!providerProfile.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {providerProfile.isAvailable ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          )}
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

      {/* Combined Jobs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Available jobs section */}
        <div className="flex flex-col gap-6">
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
            )}
          </div>
        </div>

        {/* Scheduled / Upcoming Section */}
        <div>
          <h2 className="text-xl font-bold text-text-dark mb-6">Scheduled & Active Jobs</h2>
          {upcomingGroups.length > 0 ? (
            <div className="space-y-4">
              {upcomingGroups.map(item => renderJobCard(item, true))}
            </div>
          ) : (
            <div className="bg-card rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
              <p className="text-text-muted">No upcoming jobs scheduled.</p>
            </div>
          )}
        </div>
      </div>

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedGroup(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Package Details</h3>
                <p className="text-sm text-text-muted">{selectedGroup.bookings.length} Services</p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {selectedGroup.bookings
                .sort((a, b) => new Date(a.bookingDate || '').getTime() - new Date(b.bookingDate || '').getTime())
                .map((booking, index) => (
                  <div key={booking.id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Job #{index + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      {booking.bookingDate ? format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy') : 'Date pending'}
                    </div>
                    {(booking.status === 'IN_PROGRESS' || booking.status === 'ACCEPTED') && booking.bookingDate && isToday(new Date(booking.bookingDate)) ? (
                      <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleJobClick(booking)}>
                        View
                      </Button>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}


    </div>
  )
}