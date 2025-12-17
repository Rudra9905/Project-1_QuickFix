import { useState, useEffect, useRef } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { MapPinIcon, NavigationIcon, SearchIcon } from './icons/CustomIcons'
import toast from 'react-hot-toast'

interface AddressDetails {
  street?: string
  area?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  fullAddress: string
}

// Modal that lets users search, pick, or GPS-detect an address and save coordinates
interface EditLocationModalProps {
  isOpen: boolean
  onClose: () => void
  currentAddress?: string
  onSave: (address: string, lat: number, lng: number) => void
}

export const EditLocationModal = ({
  isOpen,
  onClose,
  currentAddress = '',
  onSave,
}: EditLocationModalProps) => {
  const [searchQuery, setSearchQuery] = useState(currentAddress)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const mapRef = useRef<HTMLIFrameElement>(null)

  // Reverse geocoding using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lng: number): Promise<AddressDetails | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'QuickHelper/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }

      const data = await response.json()
      const address = data.address || {}

      // Build full address string
      const parts: string[] = []
      if (address.road || address.street) parts.push(address.road || address.street || '')
      if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood || '')
      if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village || '')
      if (address.state) parts.push(address.state)
      if (address.postcode) parts.push(address.postcode)
      if (address.country) parts.push(address.country)

      const fullAddress = parts.filter(Boolean).join(', ')

      return {
        street: address.road || address.street || '',
        area: address.suburb || address.neighbourhood || address.quarter || '',
        city: address.city || address.town || address.village || '',
        state: address.state || address.region || '',
        country: address.country || '',
        pincode: address.postcode || '',
        fullAddress: fullAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return {
        fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }
    }
  }

  // Forward geocoding for search
  const forwardGeocode = async (query: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'QuickHelper/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      if (data.length === 0) {
        return null
      }

      const result = data[0]
      const address = result.address || {}
      const parts: string[] = []
      if (address.road || address.street) parts.push(address.road || address.street || '')
      if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood || '')
      if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village || '')
      if (address.state) parts.push(address.state)
      if (address.postcode) parts.push(address.postcode)
      if (address.country) parts.push(address.country)

      const fullAddress = parts.filter(Boolean).join(', ') || result.display_name

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: fullAddress,
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Get current location using GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLatitude(lat)
        setLongitude(lng)

        // Update map
        updateMap(lat, lng)

        // Reverse geocode
        const address = await reverseGeocode(lat, lng)
        if (address) {
          setAddressDetails(address)
          setSearchQuery(address.fullAddress)
        }
        setIsLocating(false)
        toast.success('Location captured successfully!')
      },
      (error) => {
        setIsLocating(false)
        toast.error('Unable to retrieve your location. Please allow location access.')
      }
    )
  }

  // Update map iframe
  const updateMap = (lat: number, lng: number) => {
    if (mapRef.current) {
      const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
      mapRef.current.src = mapUrl
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter an address')
      return
    }

    setIsSearching(true)
    const result = await forwardGeocode(searchQuery)
    if (result) {
      setLatitude(result.lat)
      setLongitude(result.lng)
      updateMap(result.lat, result.lng)

      // Get detailed address
      const address = await reverseGeocode(result.lat, result.lng)
      if (address) {
        setAddressDetails(address)
        setSearchQuery(address.fullAddress)
      }
      toast.success('Address found!')
    } else {
      toast.error('Address not found. Please try a different search.')
    }
    setIsSearching(false)
  }

  // Handle map click (simulated via coordinate update)
  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    updateMap(lat, lng)
    reverseGeocode(lat, lng).then((address) => {
      if (address) {
        setAddressDetails(address)
        setSearchQuery(address.fullAddress)
      }
    })
  }

  // Handle save
  const handleSave = async () => {
    if (!latitude || !longitude) {
      toast.error('Please select a location first')
      return
    }

    if (!addressDetails) {
      toast.error('Please wait for address to be loaded')
      return
    }

    setIsSaving(true)
    try {
      await onSave(addressDetails.fullAddress, latitude, longitude)
      toast.success('Location saved successfully!')
      onClose()
    } catch (error: any) {
      console.error('Failed to save location:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save location';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false)
    }
  }

  // Initialize with current address if provided
  useEffect(() => {
    if (isOpen && currentAddress) {
      setSearchQuery(currentAddress)
    }
  }, [isOpen, currentAddress])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Location" size="xl">
      <div className="space-y-6">
        {/* Search or enter address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search or enter address
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SearchIcon
                size={20}
                color="#9CA3AF"
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter address or search"
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              isLoading={isSearching}
              disabled={isSearching}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Pick on map */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Pick on map
            </label>
            {isLocating && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <NavigationIcon size={16} color="#9333EA" />
                <span>Locating...</span>
              </div>
            )}
          </div>
          <div className="relative w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
            {latitude && longitude ? (
              <iframe
                ref={mapRef}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
                className="absolute inset-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <NavigationIcon size={48} color="#9CA3AF" className="mx-auto mb-2" />
                  <p className="text-gray-500">Click "Use GPS" to locate on map</p>
                </div>
              </div>
            )}
          </div>
          {addressDetails && (
            <p className="mt-2 text-sm text-gray-600 truncate">
              {addressDetails.fullAddress}
            </p>
          )}
        </div>

        {/* Address details display */}
        {addressDetails && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Address Details:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              {addressDetails.street && (
                <div>
                  <span className="font-medium">Street: </span>
                  {addressDetails.street}
                </div>
              )}
              {addressDetails.area && (
                <div>
                  <span className="font-medium">Area: </span>
                  {addressDetails.area}
                </div>
              )}
              {addressDetails.city && (
                <div>
                  <span className="font-medium">City: </span>
                  {addressDetails.city}
                </div>
              )}
              {addressDetails.state && (
                <div>
                  <span className="font-medium">State: </span>
                  {addressDetails.state}
                </div>
              )}
              {addressDetails.country && (
                <div>
                  <span className="font-medium">Country: </span>
                  {addressDetails.country}
                </div>
              )}
              {addressDetails.pincode && (
                <div>
                  <span className="font-medium">Pincode: </span>
                  {addressDetails.pincode}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={getCurrentLocation}
            variant="outline"
            isLoading={isLocating}
            disabled={isLocating || isSaving}
            className="flex items-center gap-2"
          >
            <NavigationIcon size={16} color="#9333EA" />
            Use GPS
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!latitude || !longitude || isSaving}
            className="flex-1"
          >
            Save Location
          </Button>
        </div>
      </div>
    </Modal>
  )
}

