import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { Booking, ProviderProfile } from '../types'
import { Loader } from '../components/ui/Loader'
import { Button } from '../components/ui/Button'
import { MapPinIcon, PhoneIcon, NavigationIcon } from '../components/icons/CustomIcons'
import toast from 'react-hot-toast'

// Declare Leaflet types
declare global {
    interface Window {
        L: any
    }
}

export const TrackServicePage = () => {
    const { bookingId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)

    const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
    const [isCssLoaded, setIsCssLoaded] = useState(false)
    const [distance, setDistance] = useState<string | null>(null)

    useEffect(() => {
        if (bookingId) {
            fetchData()
        }
    }, [bookingId])

    useEffect(() => {
        // Load Leaflet resources
        const checkResources = () => {
            const isScriptLoaded = !!window.L
            const isCssPresent = Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))

            if (isScriptLoaded) setIsLeafletLoaded(true)
            if (isCssPresent) setIsCssLoaded(true)

            return isScriptLoaded && isCssPresent
        }

        if (checkResources()) return

        // Load CSS
        if (!Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            link.onload = () => setIsCssLoaded(true)
            document.head.appendChild(link)
        } else {
            setIsCssLoaded(true)
        }

        // Load Script
        if (!window.L) {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            script.onload = () => setIsLeafletLoaded(true)
            document.body.appendChild(script)
        } else {
            setIsLeafletLoaded(true)
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (isLeafletLoaded && isCssLoaded && providerProfile && userLocation && mapContainerRef.current && !mapInstanceRef.current) {
            initMap()
        }
    }, [isLeafletLoaded, isCssLoaded, providerProfile, userLocation])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            if (!user) return

            // Get all bookings for user and find the specific one
            // Ideally we'd have getBookingById
            const bookings = await bookingService.getBookingsByUser(user.id)
            const found = bookings.find(b => b.id === Number(bookingId))

            if (!found) {
                toast.error('Booking not found')
                navigate('/bookings')
                return
            }
            setBooking(found)

            // Get provider profile
            if (found.provider) {
                const profile = await providerService.getProviderByUserId(found.provider.id)
                setProviderProfile(profile)
            }

            // Get user location from booking or geocode city
            if (found.user.locationLat && found.user.locationLng) {
                setUserLocation({ lat: found.user.locationLat, lng: found.user.locationLng })
            } else if (found.user.city) {
                geocodeAddress(found.user.city)
            }

        } catch (error) {
            console.error(error)
            toast.error('Failed to load tracking details')
        } finally {
            setIsLoading(false)
        }
    }

    const geocodeAddress = async (address: string) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                { headers: { 'User-Agent': 'QuickFix/1.0' } }
            )
            const data = await response.json()
            if (data.length > 0) {
                setUserLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
            }
        } catch (e) {
            console.error('Geocoding error', e)
        }
    }

    const initMap = async () => {
        if (!window.L || !mapContainerRef.current || !providerProfile?.locationLat || !providerProfile?.locationLng || !userLocation) return

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
        }

        const centerLat = (providerProfile.locationLat + userLocation.lat) / 2
        const centerLng = (providerProfile.locationLng + userLocation.lng) / 2

        const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 13)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

        // Providers Marker
        const providerIcon = window.L.divIcon({
            className: 'custom-marker provider-marker',
            html: '<div style="background-color: #5B21B6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">P</div>',
            iconSize: [30, 30]
        })
        // User Marker
        const userIcon = window.L.divIcon({
            className: 'custom-marker user-marker',
            html: '<div style="background-color: #22C55E; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">U</div>',
            iconSize: [30, 30]
        })

        window.L.marker([providerProfile.locationLat, providerProfile.locationLng], { icon: providerIcon }).addTo(map)
            .bindPopup('<b>Provider</b><br>On the way')
        window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)
            .bindPopup('<b>You</b><br>Service Location')

        // Fetch Route
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${providerProfile.locationLng},${providerProfile.locationLat};${userLocation.lng},${userLocation.lat}?overview=full&geometries=geojson`
            )
            const data = await response.json()

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0]
                const routeLine = window.L.geoJSON(route.geometry, {
                    style: { color: '#5B21B6', weight: 4, opacity: 0.7 }
                }).addTo(map)

                if (route.distance < 1000) {
                    setDistance(`${Math.round(route.distance)}m`)
                } else {
                    setDistance(`${(route.distance / 1000).toFixed(1)}km`)
                }

                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
            } else {
                // Fallback line
                const line = window.L.polyline([
                    [providerProfile.locationLat, providerProfile.locationLng],
                    [userLocation.lat, userLocation.lng]
                ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
                map.fitBounds(line.getBounds(), { padding: [50, 50] })
            }
        } catch (error) {
            console.error('Routing error:', error)
            const line = window.L.polyline([
                [providerProfile.locationLat, providerProfile.locationLng],
                [userLocation.lat, userLocation.lng]
            ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
            map.fitBounds(line.getBounds(), { padding: [50, 50] })
        }

        mapInstanceRef.current = map
    }

    if (isLoading || !booking) return <div className="flex justify-center p-10"><Loader size="lg" /></div>

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Panel: Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Service</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-green-600">
                                {booking.status === 'ACCEPTED' ? 'Provider is on the way' : 'Service in progress'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Provider Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Provider Details</h3>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <span className="text-primary font-bold text-lg">
                                        {booking.provider?.name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{booking.provider?.name}</p>
                                    <p className="text-sm text-gray-600">{booking.serviceType}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                                        <span className="text-sm font-medium text-gray-700">{providerProfile?.rating || 'New'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <a
                                    href={`tel:${booking.provider?.phone || ''}`}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${booking.provider?.phone
                                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <PhoneIcon size={18} />
                                    Call Provider
                                </a>
                            </div>
                        </div>

                        {/* OTP Section */}
                        {booking.status === 'ACCEPTED' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
                                <p className="text-sm text-blue-600 font-medium mb-2">Start Job OTP</p>
                                <div className="text-3xl font-bold text-blue-800 tracking-widest font-mono">
                                    {booking.startJobOtp || (
                                        <span className="text-xl text-blue-400">Waiting for OTP...</span>
                                    )}
                                </div>
                                <p className="text-xs text-blue-500 mt-2">
                                    {booking.startJobOtp
                                        ? "Share this code with your provider when they arrive to start the service."
                                        : "OTP will be generated shortly."}
                                </p>
                            </div>
                        )}

                        {/* Job Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service Details</h3>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Booking ID</span>
                                <span className="font-medium text-gray-900">#{booking.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Service Type</span>
                                <span className="font-medium text-gray-900">{booking.serviceType}</span>
                            </div>
                            <div className="mt-3">
                                <p className="text-sm text-gray-500 mb-1">Your Note</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {booking.note || 'No notes provided'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => navigate('/bookings')}
                        >
                            Back to Bookings
                        </Button>
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative min-h-[400px]">
                    {providerProfile?.locationLat && userLocation ? (
                        <>
                            <div ref={mapContainerRef} className="absolute inset-0 z-0" />

                            {/* Overlay Info */}
                            {distance && (
                                <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in fade-in">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <NavigationIcon size={20} color="#5B21B6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Distance away</p>
                                        <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">{distance}</p>
                                    </div>
                                </div>
                            )}

                            {/* Legend */}
                            <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2 text-xs font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-primary border border-white shadow-sm"></span>
                                    Provider
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></span>
                                    You
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <div className="bg-gray-200 p-4 rounded-full mb-4">
                                <MapPinIcon size={40} color="#9CA3AF" />
                            </div>
                            <p className="font-medium text-gray-500">Map unavailable</p>
                            <p className="text-sm mt-1">Waiting for location data from provider...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
