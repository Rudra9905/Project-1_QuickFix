import { useEffect, useState, useRef } from 'react'
import { Modal } from './ui/Modal'
import { Loader } from './ui/Loader'
import { providerService } from '../services/providerService'
import { useAuth } from '../contexts/AuthContext'
import type { Booking, ProviderProfile, User } from '../types'
import { MapPinIcon, NavigationIcon, ClockIcon, UserIcon } from './icons/CustomIcons'

// Declare Leaflet types for TypeScript
declare global {
  interface Window {
    L: any
  }
}

interface TrackingModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
}

type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

export const TrackingModal = ({ isOpen, onClose, booking }: TrackingModalProps) => {
  const { user: currentUser } = useAuth()
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('on_the_way')
  const [distance, setDistance] = useState<number | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (isOpen) {
      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => {
        if (isOpen && booking) {
          fetchLocations()
        }
      }
      document.body.appendChild(script)

      return () => {
        // Cleanup
        try {
          if (link.parentNode) document.head.removeChild(link)
          if (script.parentNode) document.body.removeChild(script)
        } catch (e) {
          // Ignore cleanup errors
        }
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove()
          } catch (e) {
            // Ignore
          }
          mapInstanceRef.current = null
        }
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = ''
        }
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && booking) {
      // Wait for Leaflet to load, then fetch locations
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet)
          fetchLocations()
        }
      }, 100)

      return () => clearInterval(checkLeaflet)
    }
  }, [isOpen, booking])

  // Geocode user address to get coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'QuickFix/1.0',
          },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  const fetchLocations = async () => {
    if (!booking) return

    try {
      setIsLoading(true)

      // Get provider location
      if (booking.provider?.id) {
        const profile = await providerService.getProviderByUserId(booking.provider.id)
        setProviderProfile(profile || null)
      }

      // Get user location
      const bookingUser = booking.user as User & { locationLat?: number; locationLng?: number }

      if (bookingUser.locationLat && bookingUser.locationLng) {
        // User has coordinates
        setUserLocation({
          lat: bookingUser.locationLat,
          lng: bookingUser.locationLng,
        })
      } else if (bookingUser.city) {
        // Geocode user's city
        const coords = await geocodeAddress(bookingUser.city)
        if (coords) {
          setUserLocation(coords)
        }
      }

      // Simulate real-time status updates
      const statusInterval = setInterval(() => {
        updateTrackingStatus()
      }, 5000)

      // Cleanup will be handled by useEffect return
      setTimeout(() => {
        clearInterval(statusInterval)
      }, 300000) // Clear after 5 minutes
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate distance using Haversine formula
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371 // Earth's radius in km
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10 // Distance in km, rounded to 1 decimal
  }

  const toRadians = (degrees: number): number => {
    return (degrees * Math.PI) / 180
  }

  // Initialize map with both locations
  useEffect(() => {
    if (
      isOpen &&
      mapContainerRef.current &&
      providerProfile?.locationLat &&
      providerProfile?.locationLng &&
      userLocation &&
      window.L &&
      !mapInstanceRef.current
    ) {
      // Ensure container is empty
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''
      }

      // Calculate center point between user and provider
      const centerLat = (providerProfile.locationLat + userLocation.lat) / 2
      const centerLng = (providerProfile.locationLng + userLocation.lng) / 2

      // Initialize map
      const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 13)

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add provider marker (blue)
      const providerMarker = window.L.marker([providerProfile.locationLat, providerProfile.locationLng], {
        icon: window.L.divIcon({
          className: 'custom-marker provider-marker',
          html: '<div style="background-color: #5B21B6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 14px;">P</span></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(map)

      providerMarker.bindPopup(`<b>${booking?.provider?.name || 'Provider'}</b><br>Current Location`)

      // Add user marker (green)
      const userMarker = window.L.marker([userLocation.lat, userLocation.lng], {
        icon: window.L.divIcon({
          className: 'custom-marker user-marker',
          html: '<div style="background-color: #22C55E; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 14px;">U</span></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(map)

      userMarker.bindPopup(`<b>${booking?.user?.name || 'User'}</b><br>Service Location`)

      // Add line between markers
      const polyline = window.L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [providerProfile.locationLat, providerProfile.locationLng],
        ],
        {
          color: '#5B21B6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 5',
        }
      ).addTo(map)

      // Calculate and set distance
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        providerProfile.locationLat,
        providerProfile.locationLng
      )
      setDistance(dist)

      // Fit map to show both markers
      const group = new window.L.FeatureGroup([providerMarker, userMarker, polyline])
      map.fitBounds(group.getBounds().pad(0.1))

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.error('Error removing map:', e)
        }
        mapInstanceRef.current = null
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''
      }
    }
  }, [isOpen, providerProfile?.locationLat, providerProfile?.locationLng, userLocation, booking])

  const updateTrackingStatus = () => {
    // In a real implementation, this would check actual location updates
    // For now, simulate status progression
    setTrackingStatus((prev) => {
      if (prev === 'on_the_way') {
        // Check if provider is near destination (simulate based on time)
        return 'reached'
      }
      return prev
    })
  }

  if (!booking) return null

  const getStatusText = () => {
    switch (trackingStatus) {
      case 'on_the_way':
        return 'On the way'
      case 'reached':
        return 'Reached your location'
      case 'arrived':
        return 'Arrived'
      default:
        return 'Tracking'
    }
  }

  const getStatusColor = () => {
    switch (trackingStatus) {
      case 'on_the_way':
        return 'text-blue-600'
      case 'reached':
        return 'text-green-600'
      case 'arrived':
        return 'text-green-700'
      default:
        return 'text-gray-600'
    }
  }

  // Get Google Maps directions URL
  const getGoogleMapsDirectionsUrl = () => {
    if (providerProfile?.locationLat && providerProfile?.locationLng && userLocation) {
      return `https://www.google.com/maps/dir/${providerProfile.locationLat},${providerProfile.locationLng}/${userLocation.lat},${userLocation.lng}`
    }
    return null
  }

  const isUser = currentUser?.role === 'USER'
  const isProvider = currentUser?.role === 'PROVIDER'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isProvider ? 'Track Customer' : 'Track Provider'}
      size="xl"
    >
      <div className="space-y-4">
        {/* Info & Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {isProvider
                    ? booking?.user?.name?.charAt(0) || 'U'
                    : booking?.provider?.name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isProvider ? booking?.user?.name || 'Customer' : booking?.provider?.name || 'Provider'}
                </h3>
                <p className="text-sm text-gray-600">{booking?.serviceType}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              <NavigationIcon size={20} />
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>

          {/* Distance Display */}
          {distance !== null && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon size={16} color="#5B21B6" />
                <span className="text-gray-700">
                  <span className="font-semibold text-primary">{distance} km</span> away
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        {isLoading ? (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <Loader size="lg" />
          </div>
        ) : providerProfile?.locationLat && providerProfile?.locationLng && userLocation ? (
          <div className="relative">
            <div
              ref={mapContainerRef}
              className="h-96 w-full rounded-lg border border-gray-200"
              style={{ zIndex: 1 }}
            />
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
              <a
                href={getGoogleMapsDirectionsUrl() || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:text-primary-600"
              >
                <NavigationIcon size={16} color="#5B21B6" />
                <span>Get Directions</span>
              </a>
            </div>
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-primary border-2 border-white"></div>
                <span>Provider</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                <span>Customer</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
            <MapPinIcon size={48} color="#9CA3AF" />
            <p className="mt-4">Location tracking not available</p>
            <p className="text-sm text-gray-400 mt-2">
              {!providerProfile?.locationLat || !providerProfile?.locationLng
                ? 'Provider location not available'
                : !userLocation
                  ? 'Customer location not available'
                  : 'Locations will appear here when available'}
            </p>
          </div>
        )}

        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon size={20} color="#2563EB" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="font-semibold text-gray-900">#{booking.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserIcon size={20} color="#5B21B6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Service Type</p>
              <p className="font-semibold text-gray-900 capitalize">{booking.serviceType.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}