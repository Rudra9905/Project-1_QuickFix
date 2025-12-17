import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Loader } from '../components/ui/Loader'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Booking, BookingStatus, ServiceType, ProviderProfile } from '../types'
import { 
  CalendarIcon, 
  UserIcon, 
  ClockIcon,
  DollarSignIcon,
  EyeIcon,
  MessageIcon,
  RescheduleIcon,
  ReceiptIcon,
  InfoIcon,
  OrangeClockIcon,
  HistoryIcon,
  CleaningIcon,
  PlumbingIcon,
  LightningIcon,
  PaintingIcon,
  ACRepairIcon,
  CarpentryIcon,
  CheckIcon,
} from '../components/icons/CustomIcons'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'

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
  REJECTED: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#16A34A' },
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

export const Bookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

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

  // Filter bookings based on active filter
  const getFilteredBookings = () => {
    switch (activeFilter) {
      case 'upcoming':
        return bookings.filter(
          (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
        )
      case 'completed':
        return bookings.filter((b) => b.status === 'COMPLETED')
      case 'cancelled':
        return bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED')
      default:
        return bookings
    }
  }

  // Separate upcoming and past bookings
  // Upcoming: REQUESTED or ACCEPTED status
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
  )
  
  // Past: COMPLETED, CANCELLED, or REJECTED status
  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
  )

  const filteredBookings = getFilteredBookings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  // Only show for users for now
  if (user?.role !== 'USER') {
    return (
      <div className="max-w-md mx-auto lg:max-w-full pb-24">
        <h1 className="text-page-title font-heading text-text-primary mb-6">Your Bookings</h1>
        <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <p className="text-body text-text-secondary">Provider booking management coming soon</p>
          </div>
        </div>
      </div>
    )
  }

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
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter
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
                {upcomingBookings.map((booking) => {
                  const serviceInfo = getServiceInfo(booking.serviceType)
                  const ServiceIcon = serviceInfo.icon
                  const statusInfo = STATUS_CONFIG[booking.status]
                  
                  return (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex gap-5">
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
                                <h3 className="text-card-title font-medium text-text-primary mb-1">
                                  {serviceInfo.label}
                                </h3>
                                <p className="text-sm text-text-secondary mb-3">
                                  Booking #{formatBookingId(booking.id)}
                                </p>
                                <div className="space-y-2">
                                  {(() => {
                                    const serviceDate = getBookingServiceDate(booking)
                                    const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
                                    return formattedDate && (
                                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <CalendarIcon size={16} color="#6B7280" />
                                        <span>{formattedDate}</span>
                                      </div>
                                    )
                                  })()}
                                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <UserIcon size={16} color="#6B7280" />
                                    {booking.provider?.name || '-'}
                                  </div>
                                  {booking.note && (
                                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded">
                                      <span className="text-xs">Note: {booking.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Section - Time & Cost */}
                          <div className="flex flex-col justify-between py-1 min-w-[140px]">
                            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                              <ClockIcon size={16} color="#6B7280" />
                              <span>{formatBookingTime(booking)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                              <DollarSignIcon size={16} color="#111827" />
                              <span>
                                {getBookingPrice(booking) 
                                  ? `$${getBookingPrice(booking)}`
                                  : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Right Section - Status & Actions */}
                          <div className="flex flex-col justify-center gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                            <button className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-light transition-colors flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-lg">visibility</span>
                              View Details
                            </button>
                            <button className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-lg">chat</span>
                              Message Provider
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
                {pastBookings.map((booking) => {
                  const serviceInfo = getServiceInfo(booking.serviceType)
                  const ServiceIcon = serviceInfo.icon
                  const statusInfo = STATUS_CONFIG[booking.status]
                  
                  return (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Service Icon */}
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${serviceInfo.color}15` }}
                          >
                            <ServiceIcon size={24} color={serviceInfo.color} />
                          </div>

                          {/* Service Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-card-title font-medium text-text-primary mb-1">
                              {serviceInfo.label}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                              {(() => {
                                try {
                                  const serviceDate = getBookingServiceDate(booking)
                                  if (serviceDate && !isNaN(serviceDate.getTime())) {
                                    return (
                                      <span>
                                        {format(serviceDate, 'MMM d, yyyy')} · {format(serviceDate, 'h:mm a')}
                                      </span>
                                    )
                                  }
                                  return null
                                } catch (error) {
                                  return null
                                }
                              })()}
                              {(booking.provider?.name || getBookingPrice(booking)) && (
                                <span>
                                  {booking.provider?.name && `Provider: ${booking.provider.name.split(' ')[0]}`}
                                  {booking.provider?.name && getBookingPrice(booking) && ' · '}
                                  {getBookingPrice(booking) && `$${getBookingPrice(booking)}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex items-center gap-4">
                            <div
                              className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                              style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                            >
                              {booking.status === 'COMPLETED' && <CheckIcon size={14} color={statusInfo.text} />}
                              {statusInfo.label}
                            </div>
                            <div className="flex items-center gap-3">
                              <button className="text-sm font-medium text-primary hover:text-primary-600 transition-colors">
                                Book Again
                              </button>
                              <button className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
                                <ReceiptIcon size={16} color="#6B7280" />
                                Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
            filteredBookings.map((booking) => {
              const serviceInfo = getServiceInfo(booking.serviceType)
              const ServiceIcon = serviceInfo.icon
              const statusInfo = STATUS_CONFIG[booking.status]
              const isUpcoming = booking.status === 'REQUESTED' || booking.status === 'ACCEPTED'
              
              if (isUpcoming) {
                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex gap-5">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${serviceInfo.color}15` }}
                            >
                              <ServiceIcon size={24} color={serviceInfo.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-card-title font-medium text-text-primary mb-1">
                                {serviceInfo.label}
                              </h3>
                              <p className="text-sm text-text-secondary mb-3">
                                Booking #{formatBookingId(booking.id)}
                              </p>
                                <div className="space-y-2">
                                  {(() => {
                                    const serviceDate = getBookingServiceDate(booking)
                                    const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
                                    return formattedDate && (
                                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <CalendarIcon size={16} color="#6B7280" />
                                        <span>{formattedDate}</span>
                                      </div>
                                    )
                                  })()}
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                  <UserIcon size={16} color="#6B7280" />
                                  {booking.provider?.name || 'Assigning provider...'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between py-1 min-w-[140px]">
                          <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                            <ClockIcon size={16} color="#6B7280" />
                            <span>{formatBookingTime(booking)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
                            <DollarSignIcon size={16} color="#111827" />
                            <span>
                              {getBookingPrice(booking) 
                                ? `$${getBookingPrice(booking)}${booking.status === 'REQUESTED' ? ' (Est.)' : ''}`
                                : booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[180px]">
                          <div
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                          >
                            {statusInfo.label}
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <button className="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                              <EyeIcon size={16} color="#FFFFFF" />
                              View Details
                            </button>
                            {booking.status === 'ACCEPTED' ? (
                              <button className="w-full border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
                                <MessageIcon size={16} color="#5B2D8B" />
                                Message Provider
                              </button>
                            ) : (
                              <button className="w-full border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
                                <RescheduleIcon size={16} color="#5B2D8B" />
                                Reschedule
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              } else {
                return (
                  <div key={booking.id} className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="size-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${serviceInfo.color}50` }}
                              >
                                <ServiceIcon size={24} color={serviceInfo.color} />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-text-dark">{serviceInfo.label}</h3>
                                <p className="text-sm text-text-muted">Booking #{formatBookingId(booking.id)}</p>
                              </div>
                            </div>
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1"
                              style={{ 
                                backgroundColor: statusInfo.bg, 
                                color: statusInfo.text,
                                borderColor: `${statusInfo.bg}20`
                              }}
                            >
                              {statusInfo.label}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {(() => {
                              const serviceDate = getBookingServiceDate(booking)
                              const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
                              return formattedDate && (
                                <div className="flex items-center gap-3 text-text-dark">
                                  <span className="material-symbols-outlined text-text-muted">calendar_today</span>
                                  <span className="font-medium">{formattedDate}</span>
                                </div>
                              )
                            })()
}
                            <div className="flex items-center gap-3 text-text-dark">
                              <span className="material-symbols-outlined text-text-muted">schedule</span>
                              <span className="font-medium">{formatBookingTime(booking)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-dark">
                              <span className="material-symbols-outlined text-text-muted">person</span>
                              <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full overflow-hidden bg-slate-200">
                                  <img 
                                    alt="Provider" 
                                    className="w-full h-full object-cover" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCk0ICsazEquhUih1_BVwrfmJOD7wOysxjwi5MfLuspepSfbotORU71N84IHBJuJ5Li_4zcMY1uq0ok_iY-UiglmncLXJ5V0BN_yGQ4fYqIQAzfgfWm3H7nZ9fGRb4rdVkuD1NOW1-SWxR5ID_gVds7ubzumdk-_X944cxCyzyXawfg7JGC1ldFU32G7EeE-c60bqMCli_mIH4l7_sGHYvfGkz2y7m0ztZAAYiA3fa-y13njaKRu4dIjzdBcK8CwcNW2rdxXq9B7Tk"
                                  />
                                </div>
                                <span className="font-medium">{booking.provider?.name || 'Assigning provider...'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-text-dark">
                              <span className="material-symbols-outlined text-text-muted">payments</span>
                              <span className="font-medium">${getBookingPrice(booking) || 'Price TBD'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                          <button className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-light transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            View Receipt
                          </button>
                          <button className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">repeat</span>
                            Book Again
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            })
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
    </div>
  )
}
