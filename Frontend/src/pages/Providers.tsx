import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { ProviderDetailModal } from '../components/ProviderDetailModal'
import { providerService } from '../services/providerService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { ProviderProfile, ServiceType } from '../types'
import { MapPinIcon, StarIcon, ClockIcon, ImageIcon } from '../components/icons/CustomIcons'

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
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocationChecked, setIsLocationChecked] = useState(false)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position.coords.latitude, position.coords.longitude)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLocationChecked(true)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationError('Unable to get your location. Using city-based filtering.')
          setIsLocationChecked(true)
        }
      )
    } else {
      console.log('Geolocation is not supported by this browser')
      setLocationError('Geolocation is not supported by your browser. Using city-based filtering.')
      setIsLocationChecked(true)
    }
  }, [])

  useEffect(() => {
    if (isLocationChecked) {
      console.log('Location check complete. Fetching providers with location:', userLocation, 'or city:', user?.city)
      fetchProviders()
    }
  }, [isLocationChecked, userLocation, user?.city])

  useEffect(() => {
    filterProviders()
  }, [providers, selectedServiceType])

  const fetchProviders = async () => {
    try {
      setIsLoading(true)

      let data: ProviderProfile[]
      if (userLocation) {
        console.log(`Fetching providers within 30km of (${userLocation.lat}, ${userLocation.lng})`)
        data = await providerService.getAllProviders(
          undefined,
          userLocation.lat,
          userLocation.lng,
          30
        )
      } else if (user?.city) {
        console.log('Fetching providers in city:', user.city)
        data = await providerService.getAllProviders(user.city)
      } else {
        console.log('No location or city info available.')
        data = []
      }

      console.log('Fetched providers:', data)
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

    if (selectedServiceType) {
      filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
    }

    setFilteredProviders(filtered)
  }

  const handleViewDetails = (provider: ProviderProfile) => {
    setSelectedProvider(provider)
    setIsDetailModalOpen(true)
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
        <h1 className="text-3xl font-bold text-gray-900">Browse Providers</h1>
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
          {filteredProviders.map((provider) => {
            const portfolioImage = provider.portfolioImages?.[0]
            const hasImage = !!portfolioImage

            return (
              <Card
                key={provider.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleViewDetails(provider)}
              >
                {/* Portfolio Image Header */}
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
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={provider.isAvailable ? 'success' : 'default'}
                      className="shadow-lg"
                    >
                      {provider.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Provider Name & Service */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {provider.user?.name || 'Provider'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">
                        {SERVICE_TYPES.find((st) => st.value === provider.serviceType)
                          ?.label || provider.serviceType}
                      </span>
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

                  {/* Description */}
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

                  {/* CTA Button */}
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(provider)
                    }}
                  >
                    View Details →
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Provider Detail Modal */}
      <ProviderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedProvider(null)
        }}
        provider={selectedProvider}
        userId={user?.id}
        userRole={user?.role}
      />
    </div>
  )
}
