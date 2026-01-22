import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { Booking, ProviderProfile } from '../types'
import { TrackingPageSkeleton } from '../components/ui/Loader'
import { Button } from '../components/ui/Button'
import { MapPinIcon, PhoneIcon } from '../components/icons/CustomIcons'
import toast from 'react-hot-toast'

// Declare Leaflet types
declare global {
    interface Window {
        L: any
    }
}

export const ActiveJobPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { openChat } = useChat()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [otpInput, setOtpInput] = useState('')
    const [showOtpInput, setShowOtpInput] = useState(false)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)

    const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
    const [isCssLoaded, setIsCssLoaded] = useState(false)

    useEffect(() => {
        fetchData()
    }, [id])

    useEffect(() => {
        // Load Leaflet resources
        const checkResources = () => {
            const isScriptLoaded = !!window.L
            // Simple check if css is present in DOM, though full load is better tracked via onload
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
            // Since we don't have getBookingById, we find it from provider list or user list
            // Hack: For now assuming provider is viewing. Ideally add getBookingById
            const bookings = await bookingService.getBookingsByProvider(user!.id)
            const found = bookings.find(b => b.id === Number(id))

            if (!found) {
                toast.error('Booking not found')
                navigate('/dashboard')
                return
            }
            setBooking(found)

            const profile = await providerService.getProviderByUserId(user!.id)
            setProviderProfile(profile)

            if (found.user.locationLat && found.user.locationLng) {
                setUserLocation({ lat: found.user.locationLat, lng: found.user.locationLng })
            } else if (found.user.city) {
                geocodeAddress(found.user.city)
            }

        } catch (error) {
            console.error(error)
            toast.error('Failed to load job details')
        } finally {
            setIsLoading(false)
        }
    }

    const geocodeAddress = async (address: string) => {
        const cacheKey = `geo_cache_${address}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                const { lat, lng } = JSON.parse(cached)
                setUserLocation({ lat, lng })
                return
            } catch (e) {
                localStorage.removeItem(cacheKey)
            }
        }

        try {
            // 1. Try full address
            let response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                { headers: { 'User-Agent': 'QuickFix/1.0' } }
            )
            let data = await response.json()
            if (data.length > 0) {
                const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                setUserLocation(coords)
                localStorage.setItem(cacheKey, JSON.stringify(coords))
                return
            }

            // 2. Fallback: Try simplified address
            const parts = address.split(',')
            if (parts.length > 1) {
                const fallbackAddress = parts.slice(Math.max(parts.length - 3, 0)).join(',').trim()
                console.log('Geocoding fallback to:', fallbackAddress)

                // Check cache for fallback
                const fallbackCacheKey = `geo_cache_${fallbackAddress}`
                const fallbackCached = localStorage.getItem(fallbackCacheKey)
                if (fallbackCached) {
                    const { lat, lng } = JSON.parse(fallbackCached)
                    setUserLocation({ lat, lng })
                    return
                }

                response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}&limit=1`,
                    { headers: { 'User-Agent': 'QuickFix/1.0' } }
                )
                data = await response.json()
                if (data.length > 0) {
                    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                    setUserLocation(coords)
                    localStorage.setItem(cacheKey, JSON.stringify(coords))
                    localStorage.setItem(fallbackCacheKey, JSON.stringify(coords))
                    return
                }
            }

            console.warn('Geocoding failed for:', address)
            toast.error('Could not find location on map')
        } catch (e) {
            console.error('Geocoding error', e)
        }
    }


    const [distance, setDistance] = useState<string | null>(null)

    // ... useEffects ...

    // ... fetchData ...

    const initMap = async () => {
        if (!window.L || !mapContainerRef.current || !providerProfile?.locationLat || !providerProfile?.locationLng || !userLocation) return

        // Final safety check
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
        }

        const centerLat = (providerProfile.locationLat + userLocation.lat) / 2
        const centerLng = (providerProfile.locationLng + userLocation.lng) / 2

        const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 13)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

        // Markers
        const providerIcon = window.L.divIcon({
            className: 'custom-marker provider-marker',
            html: '<div style="background-color: #5B21B6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">P</div>',
            iconSize: [30, 30]
        })
        const userIcon = window.L.divIcon({
            className: 'custom-marker user-marker',
            html: '<div style="background-color: #22C55E; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">U</div>',
            iconSize: [30, 30]
        })

        window.L.marker([providerProfile.locationLat, providerProfile.locationLng], { icon: providerIcon }).addTo(map)
        window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)

        // Fetch Route from OSRM
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

                // Format distance
                if (route.distance < 1000) {
                    setDistance(`${Math.round(route.distance)}m`)
                } else {
                    setDistance(`${(route.distance / 1000).toFixed(1)}km`)
                }

                map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
            } else {
                // Fallback to straight line
                const line = window.L.polyline([
                    [providerProfile.locationLat, providerProfile.locationLng],
                    [userLocation.lat, userLocation.lng]
                ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
                map.fitBounds(line.getBounds(), { padding: [50, 50] })
            }
        } catch (error) {
            console.error('Routing error:', error)
            // Fallback to straight line
            const line = window.L.polyline([
                [providerProfile.locationLat, providerProfile.locationLng],
                [userLocation.lat, userLocation.lng]
            ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
            map.fitBounds(line.getBounds(), { padding: [50, 50] })
        }

        mapInstanceRef.current = map
    }

    const handleInitiateStartJob = async () => {
        setShowOtpInput(true)
    }

    const handleStartJob = async () => {
        if (otpInput.length !== 6) return
        try {
            await bookingService.startService(booking!.id, otpInput)
            toast.success('Service Started!')
            fetchData()
            navigate('/dashboard')
        } catch (error) {
            toast.error('Invalid OTP')
        }
    }

    const handleCompleteJob = async () => {
        try {
            await bookingService.completeBooking(booking!.id)
            toast.success('Service Completed!')
            navigate('/dashboard')
        } catch (error) {
            toast.error('Failed to complete')
        }
    }

    const handleAccept = async () => {
        try {
            await bookingService.acceptBooking(booking!.id)
            toast.success('Booking accepted!')
            fetchData() // Refresh to show Start Job buttons
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to accept booking')
        }
    }

    const handleReject = async () => {
        if (!window.confirm('Are you sure you want to decline this job?')) return
        try {
            await bookingService.rejectBooking(booking!.id)
            toast.success('Booking rejected')
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject booking')
        }
    }

    if (isLoading || !booking) return <TrackingPageSkeleton />

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Panel: Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Job</h1>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {booking.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Customer Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details</h3>
                            <div className="flex items-start gap-3 mb-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <span className="material-symbols-outlined text-gray-600">person</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{booking.user.name}</p>
                                    <p className="text-sm text-gray-500">Customer</p>
                                </div>
                            </div>

                            {booking.user.phone && (
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <PhoneIcon size={20} color="#4B5563" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{booking.user.phone}</p>
                                        <a href={`tel:${booking.user.phone}`} className="text-xs text-blue-600 hover:underline">Call Customer</a>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <MapPinIcon size={20} color="#4B5563" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{booking.user.city || 'Location Pending'}</p>
                                    <p className="text-sm text-gray-500">Service Location</p>
                                </div>
                            </div>
                        </div>

                        {/* Job Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Job Details</h3>
                            <p className="text-lg font-medium text-gray-900 mb-1">{booking.serviceType}</p>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">{booking.note || 'No notes provided'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        {/* Show Start Job for ACCEPTED or IN_PROGRESS (before start) */}
                        {/* Show Accept/Decline for REQUESTED */}
                        {booking.status === 'REQUESTED' ? (
                            <div className="flex gap-3">
                                <Button onClick={handleReject} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                                    Decline
                                </Button>
                                <Button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    Accept Job
                                </Button>
                            </div>
                        ) : (booking.status === 'ACCEPTED' || (booking.status === 'IN_PROGRESS' && !booking.startedAt)) ? (
                            showOtpInput ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-xl text-center text-lg tracking-widest"
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button variant="secondary" onClick={() => setShowOtpInput(false)} className="flex-1">Cancel</Button>
                                        <Button onClick={handleStartJob} className="flex-1">Verify & Start</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button onClick={handleInitiateStartJob} className="w-full py-4 text-lg">
                                    Start Job
                                </Button>
                            )
                        ) : booking.status === 'IN_PROGRESS' && booking.startedAt ? (
                            <Button onClick={handleCompleteJob} variant="primary" className="w-full py-4 text-lg bg-green-600 hover:bg-green-700">
                                Complete Job
                            </Button>
                        ) : null}

                        <button
                            onClick={() => openChat(booking.user.id, booking.user.name)}
                            className="mt-3 block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Message Customer
                        </button>

                        {userLocation && providerProfile?.locationLat && (
                            <a
                                href={`https://www.google.com/maps/dir/${providerProfile.locationLat},${providerProfile.locationLng}/${userLocation.lat},${userLocation.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Open in Google Maps
                            </a>
                        )}
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative min-h-[400px]">
                    {providerProfile?.locationLat && userLocation ? (
                        <>
                            <div ref={mapContainerRef} className="absolute inset-0 z-0" />
                            {/* Distance Badge */}
                            {distance && (
                                <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                                    <span className="material-symbols-outlined text-blue-600">distance</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Distance</p>
                                        <p className="text-lg font-bold text-gray-900">{distance}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Map unavailable (Missing location data)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
