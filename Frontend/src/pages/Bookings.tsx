import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { BookingsSkeleton } from '../components/ui/Loader'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { useNotifications } from '../contexts/NotificationContext'
import toast from 'react-hot-toast'
import type { Booking, BookingStatus, ServiceType, ProviderProfile, User } from '../types'
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DollarSignIcon,
  CleaningIcon,
  PlumbingIcon,
  LightningIcon,
  HistoryIcon,
  StarIcon,
} from '../components/icons/CustomIcons'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { reviewService } from '../services/reviewService'

// Service type mapping with icons and labels
const SERVICE_MAPPING: Record<ServiceType, { label: string; icon: any; color: string }> = {
  CLEANER: { label: 'Cleaning', icon: CleaningIcon, color: '#3B82F6' },
  PLUMBER: { label: 'Plumbing', icon: PlumbingIcon, color: '#F97316' },
  ELECTRICIAN: { label: 'Electrical', icon: LightningIcon, color: '#FCD34D' },
  LAUNDRY: { label: 'Laundry', icon: CleaningIcon, color: '#3B82F6' },
  OTHER: { label: 'Other', icon: PlumbingIcon, color: '#F97316' },
}

// Status configuration
const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  REQUESTED: { label: 'Scheduled', bg: '#F3F4F6', text: '#6B7280' },
  ACCEPTED: { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
  REJECTED: { label: 'Declined', bg: '#FEE2E2', text: '#DC2626' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#16A34A' },
  IN_PROGRESS: { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
}

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

// Format booking ID as QF-xxxxx
const formatBookingId = (id: number): string => {
  return `QF-${String(id).padStart(5, '0')}`
}

// Format date display
const formatBookingDate = (date: Date | string): string | null => {
  try {
    if (!date) return null

    const dateObj = typeof date === 'string' ? parseISO(date) : date

    // Check if date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return null
    }

    if (isToday(dateObj)) {
      return `Today, ${format(dateObj, 'MMM d')}`
    } else if (isTomorrow(dateObj)) {
      return `Tomorrow, ${format(dateObj, 'MMM d')}`
    } else {
      return format(dateObj, 'MMM d, yyyy')
    }
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return null
  }
}

// Format time range for booking
const formatBookingTime = (booking: Booking): string | null => {
  try {
    let startDate: Date | null = null

    // If booking is accepted, use acceptedAt as service start time
    if (booking.acceptedAt) {
      const parsed = parseISO(booking.acceptedAt)
      if (!isNaN(parsed.getTime())) {
        startDate = parsed
      }
    } else if (booking.createdAt) {
      // Otherwise use createdAt
      const parsed = parseISO(booking.createdAt)
      if (!isNaN(parsed.getTime())) {
        startDate = parsed
      }
    }

    // Check if date is valid
    if (!startDate || isNaN(startDate.getTime())) {
      return null
    }

    const startTime = format(startDate, 'h:mm a')
    return startTime
  } catch (error) {
    console.error('Error formatting time:', error, booking)
    return null
  }
}

// Get booking service date (preferred date or created date)
const getBookingServiceDate = (booking: Booking): Date => {
  try {
    const dateString = booking.acceptedAt || booking.createdAt
    if (!dateString) {
      // Return current date as fallback
      return new Date()
    }
    const date = parseISO(dateString)
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return new Date()
    }
    return date
  } catch (error) {
    console.error('Error parsing booking date:', error, booking)
    return new Date()
  }
}

// Get service info
const getServiceInfo = (serviceType: ServiceType) => {
  return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
}

// Helper structure for grouped bookings
interface BookingGroup {
  id: string
  isGroup: true
  bookings: Booking[]
  provider: User
  serviceType: ServiceType
  note?: string
  earliestDate: Date | null
  latestDate: Date | null
  status: BookingStatus
}

export const Bookings = () => {
  const { user } = useAuth()
  const { openChat } = useChat()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  /* Auto-refresh on new notification */
  const { notifications } = useNotifications()
  // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
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
          latest.title.toLowerCase().includes('completed') ||
          latest.title.toLowerCase().includes('on the way') ||
          latest.title.toLowerCase().includes('arrived') ||
          latest.title.toLowerCase().includes('started') ||
          latest.title.toLowerCase().includes('provider') ||
          latest.title.toLowerCase().includes('customer');

        if (isBookingRelated) {
          console.log('New booking notification received, refreshing list...', latest.id)
          fetchBookings()
          setLastProcessedNotificationId(latest.id)
        }
      }
    }
  }, [notifications])

  useEffect(() => {
    fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // Fetch bookings and provider profiles in parallel
      const [bookingsData, providersData] = await Promise.all([
        user.role === 'USER'
          ? bookingService.getBookingsByUser(user.id)
          : bookingService.getBookingsByProvider(user.id),
        providerService.getAllProviders()
      ])

      setBookings(bookingsData)
      setProviderProfiles(providersData)
    } catch (error) {
      toast.error('Failed to load bookings')
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get provider profile for a booking
  const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
    return providerProfiles.find(p => p.userId === providerId)
  }

  // Get price for a booking
  const getBookingPrice = (booking: Booking): number | null => {
    const profile = getProviderProfile(booking.provider.id)
    return profile?.basePrice || null
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return

    try {
      await bookingService.cancelBooking(bookingId)
      toast.success('Booking cancelled successfully')
      fetchBookings() // Refresh list
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const handleBatchCancel = async (bookingIds: number[]) => {
    if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

    try {
      await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
      toast.success('All bookings in package cancelled successfully')
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling package:', error)
      toast.error('Failed to cancel some bookings in the package')
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedReviewBooking) return

    try {
      await reviewService.createReview({
        bookingId: selectedReviewBooking.id,
        rating,
        comment: comment || undefined,
      })
      toast.success('Review submitted successfully!')
      setIsReviewModalOpen(false)
      setSelectedReviewBooking(null)
      setRating(5)
      setComment('')
      fetchBookings() // Refresh to show "Review Submitted" state
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }



  // --- Grouping Logic ---
  const groupBookings = (list: Booking[]) => {
    const groups: (Booking | BookingGroup)[] = []
    const processedIds = new Set<number>()

    // Sort by recent first
    const sortedRaw = [...list].sort((a, b) => {
      const dateA = new Date(a.bookingDate || a.createdAt).getTime()
      const dateB = new Date(b.bookingDate || b.createdAt).getTime()
      return dateB - dateA
    })

    sortedRaw.forEach(booking => {
      if (processedIds.has(booking.id)) return

      // Check if this is a "Multiple Booking Package"
      // We group by Provider + Service + Note + Status (loosely, or just show header status)
      // Usually packages have same status, but if split, we might want to split groups.
      // For simplicity, let's group by Provider + Service + Note.
      if (booking.note === 'Multiple Booking Package') {
        const peers = sortedRaw.filter(b =>
          !processedIds.has(b.id) &&
          b.provider.id === booking.provider.id &&
          b.serviceType === booking.serviceType &&
          b.note === 'Multiple Booking Package'
          // Not filtering by status strictly to keep package together? 
          // Or should we only group same-status items? 
          // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
          && b.status === booking.status
        )

        if (peers.length > 1) {
          const dates = peers
            .map(b => new Date(b.bookingDate || ''))
            .filter(d => !isNaN(d.getTime()))

          const group: BookingGroup = {
            id: `group-${peers[0].id}`,
            isGroup: true,
            bookings: peers,
            provider: booking.provider,
            serviceType: booking.serviceType,
            note: booking.note,
            earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
            latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
            status: booking.status
          }
          groups.push(group)
          peers.forEach(p => processedIds.add(p.id))
          return
        }
      }

      groups.push(booking)
      processedIds.add(booking.id)
    })

    return groups
  }


  // Separate upcoming and past bookings
  // Upcoming: REQUESTED or ACCEPTED status
  const upcomingRaw = bookings.filter(
    (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
  )
  const upcomingBookings = groupBookings(upcomingRaw)


  // Past: COMPLETED, CANCELLED, or REJECTED status
  const pastRaw = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
  )
  const pastBookings = groupBookings(pastRaw)

  // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
  const getFilteredList = () => {
    let raw: Booking[] = []
    switch (activeFilter) {
      case 'upcoming':
        raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
        break
      case 'completed':
        raw = bookings.filter(b => b.status === 'COMPLETED')
        break
      case 'cancelled':
        raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
        break
      case 'all':
      default:
        return [...upcomingBookings, ...pastBookings] // Already grouped
    }
    return groupBookings(raw)
  }

  const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


  if (isLoading) {
    return <BookingsSkeleton />
  }

  // Render Helper
  const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
    const isGroup = (item as BookingGroup).isGroup
    const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
    const group = isGroup ? (item as BookingGroup) : null

    const serviceInfo = getServiceInfo(booking.serviceType)
    const ServiceIcon = serviceInfo.icon
    const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

    const price = isGroup ?
      (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
      getBookingPrice(booking)

    return (
      <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-4 md:gap-5">
            {/* Left Section - Service Details */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${serviceInfo.color}15` }}
                >
                  <ServiceIcon size={24} color={serviceInfo.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-card-title font-medium text-text-primary">
                      {serviceInfo.label}
                    </h3>
                    {isGroup && (
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        Package ({group!.bookings.length})
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text-secondary mb-3">
                    {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
                  </p>
                  <div className="space-y-2">
                    {/* Date Display */}
                    {isGroup ? (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <CalendarIcon size={16} color="#6B7280" />
                        <span>
                          {group!.earliestDate && group!.latestDate
                            ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
                            : 'Dates Pending'}
                        </span>
                      </div>
                    ) : (
                      (() => {
                        const serviceDate = getBookingServiceDate(booking)
                        const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
                        return formattedDate && (
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <CalendarIcon size={16} color="#6B7280" />
                            <span>{formattedDate}</span>
                          </div>
                        )
                      })()
                    )}

                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <UserIcon size={16} color="#6B7280" />
                      <span className="truncate">
                        {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
                      </span>
                    </div>
                    {/* OTP Display for User - Only visible to Customers */}
                    {user?.role === 'USER' && (
                      isGroup ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group!.bookings.map(b => (
                            (b.status === 'ACCEPTED' && b.startJobOtp) && (
                              <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
                                <span className="text-xs text-blue-600 mb-1 font-medium">
                                  {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
                                </span>
                                <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        booking.status === 'ACCEPTED' && booking.startJobOtp && (
                          <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
                            <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
                            <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
                          </div>
                        )
                      )
                    )}
                    {(booking.note || isGroup) && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
                        <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section - Time & Cost */}
            <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
                <ClockIcon size={16} color="#6B7280" />
                <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                <DollarSignIcon size={16} color="#111827" />
                <span>
                  {price
                    ? `$${price}`
                    : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
                </span>
              </div>
            </div>

            {/* Right Section - Status & Actions */}
            <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
              {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
                  Actually, let's keep it but position it better. 
                  In this new layout, we might want it at the top of the card or just here.
                  Let's keep it here but align appropriately.
              */}
              <div className="flex justify-between md:justify-end mb-1">
                <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                  >
                    {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
                  </div>
                  {booking.status === 'REQUESTED' && (
                    <span className="text-xs text-gray-400">Pending</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
                {/* Actions - Simplified for Group */}

                {/* Track Service Button for Users */}
                {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => window.location.href = `/track-service/${booking.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    Track Service
                  </button>
                )}

                {/* Cancel & Reschedule Buttons */}
                {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => isGroup
                        ? handleBatchCancel(group!.bookings.map(b => b.id))
                        : handleCancelBooking(booking.id)
                      }
                      className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Cancel {isGroup ? 'Package' : ''}
                    </button>
                  </div>
                )}
                {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
                  <button
                    onClick={() => {
                      let targetId: number
                      let targetName: string

                      if (user?.role === 'PROVIDER') {
                        targetId = booking.user.id
                        targetName = booking.user.name
                      } else {
                        targetId = isGroup ? group!.provider.id : booking.provider.id
                        targetName = isGroup ? group!.provider.name : booking.provider.name
                      }

                      openChat(targetId, targetName)
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
                  </button>
                )}

                {booking.status === 'COMPLETED' && (
                  booking.reviewId ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Review Submitted
                    </button>
                  ) : (
                    user?.role === 'USER' && (
                      <button
                        onClick={() => {
                          setSelectedReviewBooking(booking)
                          setIsReviewModalOpen(true)
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">star</span>
                        Write Review
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render bookings for both USER and PROVIDER roles
  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
          <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
        </div>

        <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
          {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:bg-surface'
                }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on filter */}
      {activeFilter === 'all' ? (
        <>
          {/* Upcoming Appointments Section */}
          {upcomingBookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-orange">schedule</span>
                Upcoming Appointments
              </h2>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
              </div>
            </div>
          )}

          {/* Past History Section */}
          {pastBookings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HistoryIcon size={20} color="#6B7280" />
                <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
                  <span className="material-symbols-outlined text-text-muted">history</span>
                  Past History
                </h2>
              </div>
              <div className="space-y-3">
                {pastBookings.map((booking) => renderBookingCard(booking, false))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Filtered view
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-12 text-center">
                <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
              </div>
            </div>
          ) : (
            filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
          )}
        </div>
      )}

      {upcomingBookings.length === 0 && pastBookings.length === 0 && (
        <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <p className="text-body text-text-secondary">No bookings found</p>
          </div>
        </div>
      )}


      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setSelectedReviewBooking(null)
          setRating(5)
          setComment('')
        }}
        title="Write a Review"
      >
        {selectedReviewBooking && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <StarIcon
                      size={32}
                      color={star <= rating ? '#FCD34D' : '#D1D5DB'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              label="Comment (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsReviewModalOpen(false)
                  setSelectedReviewBooking(null)
                  setRating(5)
                  setComment('')
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div >
  )
}
