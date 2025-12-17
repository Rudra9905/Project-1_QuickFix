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
import { ArrowLeftIcon, MapPinIcon, StarIcon, DollarSignIcon } from '../components/icons/CustomIcons'

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
  const bookingType = location.state?.bookingType as 'single' | 'weekly' | undefined
  const serviceType = location.state?.serviceType as ServiceType | undefined

  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [filteredProviders, setFilteredProviders] = useState<ProviderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>(serviceType || '')
  const [isPrebookModalOpen, setIsPrebookModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocationChecked, setIsLocationChecked] = useState(false) // New state to track if location check is complete

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
          setIsLocationChecked(true); // Mark location check as complete
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Using city-based filtering.');
          setIsLocationChecked(true); // Mark location check as complete even on error
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser');
      setLocationError('Geolocation is not supported by your browser. Using city-based filtering.');
      setIsLocationChecked(true); // Mark location check as complete
    }
  }, []);

  useEffect(() => {
    // Fetch providers only after location check is complete
    if (isLocationChecked) {
      console.log('Location check complete. Fetching providers with location:', userLocation, 'or city:', user?.city);
      fetchProviders()
    }
  }, [isLocationChecked, userLocation, user?.city])

  useEffect(() => {
    filterProviders()
  }, [providers, selectedServiceType])

  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      
      // Use distance-based filtering if we have user location, otherwise use city
      let data: ProviderProfile[];
      if (userLocation) {
        console.log(`Fetching available providers within 30km of (${userLocation.lat}, ${userLocation.lng}) for service type:`, selectedServiceType || serviceType || 'OTHER');
        // Fetch available providers within 30km
        data = await providerService.getAvailableProviders(
          selectedServiceType || serviceType || 'OTHER', // Default to OTHER if no service type
          undefined, // city
          userLocation.lat,
          userLocation.lng,
          30 // max distance in km
        );
      } else if (user?.city) {
        console.log('Fetching available providers in city:', user.city, 'for service type:', selectedServiceType || serviceType || 'OTHER');
        // Fallback to city-based filtering
        data = await providerService.getAvailableProviders(
          selectedServiceType || serviceType || 'OTHER',
          user.city
        );
      } else {
        console.log('No location or city info available. Showing no providers to respect geographic restrictions.');
        // No location info, show no providers to respect geographic restrictions
        data = [];
      }
      
      console.log('Fetched providers:', data);
      setProviders(data)
      setFilteredProviders(data)
    } catch (error) {
      toast.error('Failed to load providers')
      console.error('Error fetching providers:', error)
      setProviders([])
      setFilteredProviders([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterProviders = () => {
    let filtered = providers

    // Only show online/available providers
    filtered = filtered.filter((p) => p.isAvailable)

    if (selectedServiceType) {
      filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
    }

    setFilteredProviders(filtered)
  }

  const handleSelectProvider = (provider: ProviderProfile) => {
    setSelectedProvider(provider)
    setIsPrebookModalOpen(true)
  }

  const handlePrebook = async (data: {
    bookingType: 'single' | 'weekly'
    serviceType: ServiceType
    date: string
    time?: string
    note?: string
  }) => {
    if (!user || !selectedProvider) return

    try {
      if (data.bookingType === 'weekly') {
        // Create 7 bookings for the week
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
        // Single booking
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

  if (isLoading || !isLocationChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div>
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
            {bookingType === 'weekly' ? 'Select Provider for Weekly Booking' : 'Select Provider'}
          </h1>
          <p className="text-gray-600 mt-1">
            Choose a provider from your area
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
            const serviceLabel = SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType
            return (
              <Card
                key={provider.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectProvider(provider)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {serviceLabel}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <StarIcon size={16} color="#FCD34D" />
                        <span className="text-sm font-medium text-gray-900">
                          {provider.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">/ 5.0</span>
                      </div>
                    </div>
                    <Badge variant={provider.isAvailable ? 'success' : 'default'}>
                      {provider.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </div>

                  {provider.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {provider.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {provider.basePrice && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSignIcon size={16} color="#6B7280" className="mr-2" />
                        From ${provider.basePrice}
                      </div>
                    )}
                    {provider.locationLat && provider.locationLng && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon size={16} color="#6B7280" className="mr-2" />
                        Location Available
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!provider.isAvailable) {
                        toast.error('This provider is currently offline and not accepting requests')
                        return
                      }
                      handleSelectProvider(provider)
                    }}
                    disabled={!provider.isAvailable}
                  >
                    {provider.isAvailable ? 'Select & Prebook' : 'Offline - Not Available'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PrebookModal
        isOpen={isPrebookModalOpen}
        onClose={() => {
          setIsPrebookModalOpen(false)
          setSelectedProvider(null)
        }}
        onConfirm={handlePrebook}
        providerId={selectedProvider?.userId}
        serviceType={selectedProvider?.serviceType}
      />
    </div>
  )
}
