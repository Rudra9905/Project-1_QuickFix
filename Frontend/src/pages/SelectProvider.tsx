import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { PrebookModal } from '../components/PrebookModal'
import { providerService } from '../services/providerService'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { ProviderProfile, ServiceType } from '../types'
import { ArrowLeftIcon, MapPinIcon, StarIcon, CheckCircleIcon, ClockIcon, ImageIcon } from '../components/icons/CustomIcons'

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'PLUMBER', label: 'Plumber' },
  { value: 'ELECTRICIAN', label: 'Electrician' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'OTHER', label: 'Other' },
]

// Create SERVICE_TYPE_LABELS from SERVICE_TYPES array
const SERVICE_TYPE_LABELS: Record<ServiceType, string> = SERVICE_TYPES.reduce((acc, service) => {
  acc[service.value] = service.label;
  return acc;
}, {} as Record<ServiceType, string>);

export const SelectProvider = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // State for Booking Flow
  const bookingType = location.state?.bookingType as 'single' | 'weekly' | 'multiple' | undefined
  const serviceType = location.state?.serviceType as ServiceType | undefined
  const startDate = location.state?.startDate as string | undefined
  const endDate = location.state?.endDate as string | undefined

  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [filteredProviders, setFilteredProviders] = useState<ProviderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>(serviceType || '')

  // Single Booking State
  const [isPrebookModalOpen, setIsPrebookModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)

  // Multiple Booking State (Cart)
  const [selectedProviders, setSelectedProviders] = useState<ProviderProfile[]>([])
  const [isBatchBooking, setIsBatchBooking] = useState(false)

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocationChecked, setIsLocationChecked] = useState(false)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position.coords.latitude, position.coords.longitude);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocationChecked(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocationChecked(true);
        }
      );
    } else {
      setIsLocationChecked(true);
    }
  }, []);

  useEffect(() => {
    if (isLocationChecked) {    
      fetchProviders()
    }
  }, [isLocationChecked, userLocation, user?.city])

  useEffect(() => {
    filterProviders()
  }, [providers, selectedServiceType])

  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      let data: ProviderProfile[];

      const targetServiceType = selectedServiceType || serviceType;

      if (targetServiceType) {
        // Fetch specific service type
        if (userLocation) {
          data = await providerService.getAvailableProviders(
            targetServiceType,
            undefined,
            userLocation.lat,
            userLocation.lng,
            30
          );
        } else {
          // Use city or fetch all if no city
          data = await providerService.getAvailableProviders(
            targetServiceType,
            user?.city || undefined
          );
        }
      } else {
        // Fetch ALL services (no type filter)
        if (userLocation) {
          data = await providerService.getAllProviders(
            undefined,
            userLocation.lat,
            userLocation.lng,
            30
          );
        } else {
          // Use city or fetch all if no city
          data = await providerService.getAllProviders(
            user?.city || undefined
          );
        }
      }

      setProviders(data)
      setFilteredProviders(data)
    } catch (error) {
      toast.error('Failed to load providers')
      setProviders([])
      setFilteredProviders([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterProviders = () => {
    let filtered = providers
    filtered = filtered.filter((p) => p.isAvailable)
    if (selectedServiceType) {
      filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
    }
    setFilteredProviders(filtered)
  }

  // --- Handlers ---

  const handleProviderClick = (provider: ProviderProfile) => {
    if (bookingType === 'multiple') {
      toggleProviderSelection(provider)
    } else {
      // Single Booking Flow
      setSelectedProvider(provider)
      setIsPrebookModalOpen(true)
    }
  }

  const toggleProviderSelection = (provider: ProviderProfile) => {
    setSelectedProviders(prev => {
      const exists = prev.find(p => p.id === provider.id)
      if (exists) {
        return prev.filter(p => p.id !== provider.id)
      } else {
        return [...prev, provider]
      }
    })
  }

  const handleSingleBookingSubmit = async (data: {
    bookingType: 'single' | 'weekly'
    serviceType: ServiceType
    date: string
    time?: string
    note?: string
  }) => {
    if (!user || !selectedProvider) return

    try {
      if (data.bookingType === 'weekly') {
        const startDate = new Date(data.date)
        let successCount = 0
        for (let i = 0; i < 7; i++) {
          const bookingDate = new Date(startDate)
          bookingDate.setDate(startDate.getDate() + i)
          try {
            await bookingService.createBooking(user.id, {
              providerId: selectedProvider.userId,
              serviceType: data.serviceType,
              note: data.note,
              bookingDate: bookingDate.toISOString().split('T')[0],
              preferredTime: data.time,
            })
            successCount++
          } catch (error) {
            console.error(`Failed to create booking for day ${i + 1}`)
          }
        }
        toast.success(`Created ${successCount} weekly bookings successfully!`)
      } else {
        await bookingService.createBooking(user.id, {
          providerId: selectedProvider.userId,
          serviceType: data.serviceType,
          note: data.note,
          bookingDate: data.date,
          preferredTime: data.time,
        })
        toast.success(
          `Booking request sent to ${SERVICE_TYPE_LABELS[selectedProvider.serviceType]} for ${new Date(data.date).toLocaleDateString()}`
        )
      }
      setIsPrebookModalOpen(false)
      setSelectedProvider(null)
      navigate('/bookings')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking')
    }
  }

  const handleBatchBookingSubmit = async () => {
    if (!user || !startDate || !endDate || selectedProviders.length === 0) return

    setIsBatchBooking(true)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = []

    // Generate dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    let successCount = 0
    let failCount = 0

    try {
      // Loop through each provider and each day
      for (const provider of selectedProviders) {
        for (const day of days) {
          try {
            await bookingService.createBooking(user.id, {
              providerId: provider.userId,
              serviceType: provider.serviceType,
              note: 'Multiple Booking Package',
              bookingDate: day.toISOString().split('T')[0],
              preferredTime: '09:00', // Default time for batch
            })
            successCount++
          } catch (err) {
            console.error('Failed booking', err)
            failCount++
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} bookings!`)
        navigate('/bookings')
      } else {
        toast.error('Failed to create bookings. Please try again.')
      }

    } catch (error) {
      console.error('Batch booking fatal error', error)
      toast.error('An error occurred during booking processing')
    } finally {
      setIsBatchBooking(false)
    }
  }

  if (isLoading || !isLocationChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon size={16} color="#9333EA" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {bookingType === 'multiple' ? 'Select Providers' : 'Select Provider'}
          </h1>
          <p className="text-gray-600 mt-1">
            {bookingType === 'multiple'
              ? `Booking from ${startDate} to ${endDate}`
              : 'Choose a provider from your area'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
        <div className="w-full sm:w-64">
          <Select
            value={selectedServiceType}
            onChange={(e) =>
              setSelectedServiceType(e.target.value as ServiceType | '')
            }
            options={[
              { value: '', label: 'All Services' },
              ...SERVICE_TYPES,
            ]}
          />
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No providers found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/dashboard')}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => {
            const isSelected = selectedProviders.some(p => p.id === provider.id)
            const portfolioImage = provider.portfolioImages?.[0]
            const hasImage = !!portfolioImage
            const serviceLabel = SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType

            return (
              <Card
                key={provider.id}
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                onClick={() => handleProviderClick(provider)}
              >
                {/* Portfolio Header */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {hasImage ? (
                    <img
                      src={portfolioImage}
                      alt={`${provider.user?.name || 'Provider'}'s work`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} color="#9CA3AF" />
                    </div>
                  )}
                  {/* Selection Indicator (Top Right) */}
                  {bookingType === 'multiple' && isSelected && (
                    <div className="absolute top-3 right-3 z-10 bg-white rounded-full p-1 shadow-md">
                      <CheckCircleIcon size={24} color="#7C3AED" />
                    </div>
                  )}
                </div>

                <CardContent className="p-5">
                  {/* Header Row: Name & Availability */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {provider.user?.name || 'Provider'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">{serviceLabel}</span>
                        {provider.experienceYears && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ClockIcon size={14} />
                              {provider.experienceYears} yrs exp
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Availability Badge (Only if NOT selected, to avoid clutter) */}
                    {(!isSelected || bookingType !== 'multiple') && (
                      <Badge variant={provider.isAvailable ? 'success' : 'default'}>
                        {provider.isAvailable ? 'Available' : 'Busy'}
                      </Badge>
                    )}
                  </div>

                  {provider.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {provider.description}
                    </p>
                  )}

                  {/* Rating & Price */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <StarIcon size={18} color="#FCD34D" />
                      <span className="text-lg font-bold text-gray-900">
                        {provider.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">/5.0</span>
                    </div>
                    {provider.basePrice && (
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          ₹{provider.basePrice}
                        </div>
                        <div className="text-xs text-gray-500">base price</div>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <MapPinIcon size={16} />
                    <span>{provider.user?.city || 'Location not set'}</span>
                  </div>

                  <Button
                    className="w-full"
                    variant={isSelected ? 'secondary' : 'primary'}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!provider.isAvailable) {
                        toast.error('Provider offline')
                        return
                      }
                      handleProviderClick(provider)
                    }}
                    disabled={!provider.isAvailable}
                  >
                    {!provider.isAvailable
                      ? 'Offline'
                      : bookingType === 'multiple'
                        ? (isSelected ? 'Remove from List' : 'Add to List')
                        : 'Select & Prebook'
                    }
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Booking Cart / Bottom Bar for Multiple Mode */}
      {bookingType === 'multiple' && selectedProviders.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg">{selectedProviders.length} Providers Selected</h4>
              <p className="text-gray-400 text-sm">
                {startDate} - {endDate} (Creating batch bookings)
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100"
              onClick={handleBatchBookingSubmit}
              disabled={isBatchBooking}
            >
              {isBatchBooking ? 'Processing...' : 'Confirm All Bookings'}
            </Button>
          </div>
        </div>
      )}

      {/* Prebook Modal - Only for Single/Weekly (Not Multiple Batch) */}
      <PrebookModal
        isOpen={isPrebookModalOpen}
        onClose={() => {
          setIsPrebookModalOpen(false)
          setSelectedProvider(null)
        }}
        onConfirm={handleSingleBookingSubmit}
        providerId={selectedProvider?.userId}
        serviceType={selectedProvider?.serviceType}
      />
    </div>
  )
}
