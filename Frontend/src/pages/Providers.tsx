import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { providerService } from '../services/providerService'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { ProviderProfile, ServiceType, BookingRequest } from '../types'
import { MapPinIcon, StarIcon, DollarSignIcon } from '../components/icons/CustomIcons'

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'PLUMBER', label: 'Plumber' },
  { value: 'ELECTRICIAN', label: 'Electrician' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'OTHER', label: 'Other' },
]

export const Providers = () => {
  const { user } = useAuth()
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [filteredProviders, setFilteredProviders] = useState<ProviderProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>('')
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)
  const [bookingNote, setBookingNote] = useState('')
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
        console.log(`Fetching providers within 30km of (${userLocation.lat}, ${userLocation.lng})`);
        // Fetch providers within 30km
        data = await providerService.getAllProviders(
          undefined, // city
          userLocation.lat,
          userLocation.lng,
          30 // max distance in km
        );
      } else if (user?.city) {
        console.log('Fetching providers in city:', user.city);
        // Fallback to city-based filtering
        data = await providerService.getAllProviders(user.city);
      } else {
        console.log('No location or city info available. Showing no providers to respect geographic restrictions.');
        // No location info, show no providers to respect geographic restrictions
        data = [];
      }
      
      console.log('Fetched providers:', data);
      setProviders(data)
    } catch (error: any) {
      console.error('Error fetching providers:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load providers'
      toast.error(errorMessage)
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterProviders = () => {
    let filtered = providers

    // Show all providers (available and unavailable)
    // Users can see offline providers but won't be able to book them
    // This helps troubleshoot why no providers are showing

    if (selectedServiceType) {
      filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
    }

    setFilteredProviders(filtered)
  }

  const handleBookService = async () => {
    if (!selectedProvider || !user) return

    try {
      const bookingRequest: BookingRequest = {
        providerId: selectedProvider.userId,
        serviceType: selectedProvider.serviceType,
        note: bookingNote || undefined,
      }
      await bookingService.createBooking(user.id, bookingRequest)
      toast.success('Booking request sent successfully!')
      setIsBookingModalOpen(false)
      setBookingNote('')
      setSelectedProvider(null)
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
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Available Providers</h1>
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

      {providers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-2">No providers found</p>
            {user?.city ? (
              <p className="text-sm text-gray-400">
                No providers available in {user.city}. Try updating your location or check back later.
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Please set your location in your profile to see providers near you.
              </p>
            )}
          </CardContent>
        </Card>
      ) : filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-2">No providers found for selected service</p>
            <p className="text-sm text-gray-400">
              Try selecting a different service type from the filter above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>
                    {SERVICE_TYPES.find((st) => st.value === provider.serviceType)
                      ?.label || provider.serviceType}
                  </CardTitle>
                  <Badge
                    variant={provider.isAvailable ? 'success' : 'default'}
                  >
                    {provider.isAvailable ? 'Available' : 'Busy'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {provider.description && (
                  <p className="text-gray-600 mb-4">{provider.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <StarIcon size={16} color="#FCD34D" className="mr-2" />
                    Rating: {provider.rating.toFixed(1)} / 5.0
                  </div>
                  {provider.basePrice && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSignIcon size={16} color="#6B7280" className="mr-2" />
                      Base Price: ${provider.basePrice}
                    </div>
                  )}
                  {provider.locationLat && provider.locationLng && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon size={16} color="#6B7280" className="mr-2" />
                      Location Available
                    </div>
                  )}
                </div>
                {user?.role === 'USER' && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!provider.isAvailable) {
                        toast.error('This provider is currently offline and not accepting requests')
                        return
                      }
                      setSelectedProvider(provider)
                      setIsBookingModalOpen(true)
                    }}
                    disabled={!provider.isAvailable}
                  >
                    {provider.isAvailable ? 'Book Service' : 'Offline - Not Available'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setBookingNote('')
          setSelectedProvider(null)
        }}
        title="Book Service"
      >
        {selectedProvider && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Service: {SERVICE_TYPES.find((st) => st.value === selectedProvider.serviceType)?.label}
              </p>
              {selectedProvider.basePrice && (
                <p className="text-sm text-gray-600">
                  Base Price: ${selectedProvider.basePrice}
                </p>
              )}
            </div>
            <Textarea
              label="Additional Notes (Optional)"
              value={bookingNote}
              onChange={(e) => setBookingNote(e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsBookingModalOpen(false)
                  setBookingNote('')
                  setSelectedProvider(null)
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleBookService}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
