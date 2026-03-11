// import { useState, useEffect, useRef } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useChat } from '../contexts/ChatContext'
// import { bookingService } from '../services/bookingService'
// import { providerService } from '../services/providerService'
// import { Booking, ProviderProfile } from '../types'
// import { TrackingPageSkeleton } from '../components/ui/Loader'
// import { Button } from '../components/ui/Button'
// import { MapPinIcon, PhoneIcon } from '../components/icons/CustomIcons'
// import toast from 'react-hot-toast'



// // Declare Leaflet types
// declare global {
//     interface Window {
//         L: any
//     }
// }

// export const ActiveJobPage = () => {
//     const { id } = useParams<{ id: string }>()
//     const navigate = useNavigate()
//     const { user } = useAuth()
//     const { openChat } = useChat()
//     const [booking, setBooking] = useState<Booking | null>(null)
//     const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
//     const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
//     const [isLoading, setIsLoading] = useState(true)
//     const [otpInput, setOtpInput] = useState('')
//     const [showOtpInput, setShowOtpInput] = useState(false)
//     const mapContainerRef = useRef<HTMLDivElement>(null)
//     const mapInstanceRef = useRef<any>(null)

//     const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
//     const [isCssLoaded, setIsCssLoaded] = useState(false)

//     useEffect(() => {
//         fetchData()
//     }, [id])

//     useEffect(() => {
//         // Load Leaflet resources
//         const checkResources = () => {
//             const isScriptLoaded = !!window.L
//             // Simple check if css is present in DOM, though full load is better tracked via onload
//             const isCssPresent = Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))

//             if (isScriptLoaded) setIsLeafletLoaded(true)
//             if (isCssPresent) setIsCssLoaded(true)

//             return isScriptLoaded && isCssPresent
//         }

//         if (checkResources()) return

//         // Load CSS
//         if (!Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))) {
//             const link = document.createElement('link')
//             link.rel = 'stylesheet'
//             link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
//             link.onload = () => setIsCssLoaded(true)
//             document.head.appendChild(link)
//         } else {
//             setIsCssLoaded(true)
//         }

//         // Load Script
//         if (!window.L) {
//             const script = document.createElement('script')
//             script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
//             script.onload = () => setIsLeafletLoaded(true)
//             document.body.appendChild(script)
//         } else {
//             setIsLeafletLoaded(true)
//         }

//         return () => {
//             if (mapInstanceRef.current) {
//                 mapInstanceRef.current.remove()
//                 mapInstanceRef.current = null
//             }
//         }
//     }, [])

//     useEffect(() => {
//         if (isLeafletLoaded && isCssLoaded && providerProfile && userLocation && mapContainerRef.current && !mapInstanceRef.current) {
//             initMap()
//         }
//     }, [isLeafletLoaded, isCssLoaded, providerProfile, userLocation])

//     const fetchData = async () => {
//         try {
//             setIsLoading(true)
//             // Since we don't have getBookingById, we find it from provider list or user list
//             // Hack: For now assuming provider is viewing. Ideally add getBookingById
//             const bookings = await bookingService.getBookingsByProvider(user!.id)
//             const found = bookings.find(b => b.id === Number(id))

//             if (!found) {
//                 toast.error('Booking not found')
//                 navigate('/dashboard')
//                 return
//             }
//             setBooking(found)

//             const profile = await providerService.getProviderByUserId(user!.id)
//             setProviderProfile(profile)

//             if (found.user.locationLat && found.user.locationLng) {
//                 setUserLocation({ lat: found.user.locationLat, lng: found.user.locationLng })
//             } else if (found.user.city) {
//                 geocodeAddress(found.user.city)
//             }

//         } catch (error) {
//             console.error(error)
//             toast.error('Failed to load job details')
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     const geocodeAddress = async (address: string) => {
//         const cacheKey = `geo_cache_${address}`
//         const cached = localStorage.getItem(cacheKey)
//         if (cached) {
//             try {
//                 const { lat, lng } = JSON.parse(cached)
//                 setUserLocation({ lat, lng })
//                 return
//             } catch (e) {
//                 localStorage.removeItem(cacheKey)
//             }
//         }

//         try {
//             // 1. Try full address
//             let response = await fetch(
//                 `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
//                 { headers: { 'User-Agent': 'QuickFix/1.0' } }
//             )
//             let data = await response.json()
//             if (data.length > 0) {
//                 const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
//                 setUserLocation(coords)
//                 localStorage.setItem(cacheKey, JSON.stringify(coords))
//                 return
//             }

//             // 2. Fallback: Try simplified address
//             const parts = address.split(',')
//             if (parts.length > 1) {
//                 const fallbackAddress = parts.slice(Math.max(parts.length - 3, 0)).join(',').trim()
//                 console.log('Geocoding fallback to:', fallbackAddress)

//                 // Check cache for fallback
//                 const fallbackCacheKey = `geo_cache_${fallbackAddress}`
//                 const fallbackCached = localStorage.getItem(fallbackCacheKey)
//                 if (fallbackCached) {
//                     const { lat, lng } = JSON.parse(fallbackCached)
//                     setUserLocation({ lat, lng })
//                     return
//                 }

//                 response = await fetch(
//                     `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}&limit=1`,
//                     { headers: { 'User-Agent': 'QuickFix/1.0' } }
//                 )
//                 data = await response.json()
//                 if (data.length > 0) {
//                     const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
//                     setUserLocation(coords)
//                     localStorage.setItem(cacheKey, JSON.stringify(coords))
//                     localStorage.setItem(fallbackCacheKey, JSON.stringify(coords))
//                     return
//                 }
//             }

//             console.warn('Geocoding failed for:', address)
//             toast.error('Could not find location on map')
//         } catch (e) {
//             console.error('Geocoding error', e)
//         }
//     }


//     const [distance, setDistance] = useState<string | null>(null)

//     // ... useEffects ...

//     // ... fetchData ...

//     const initMap = async () => {
//         if (!window.L || !mapContainerRef.current || !providerProfile?.locationLat || !providerProfile?.locationLng || !userLocation) return

//         // Final safety check
//         if (mapInstanceRef.current) {
//             mapInstanceRef.current.remove()
//         }

//         const centerLat = (providerProfile.locationLat + userLocation.lat) / 2
//         const centerLng = (providerProfile.locationLng + userLocation.lng) / 2

//         const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 13)
//         window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

//         // Markers
//         const providerIcon = window.L.divIcon({
//             className: 'custom-marker provider-marker',
//             html: '<div style="background-color: #5B21B6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">P</div>',
//             iconSize: [30, 30]
//         })
//         const userIcon = window.L.divIcon({
//             className: 'custom-marker user-marker',
//             html: '<div style="background-color: #22C55E; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">U</div>',
//             iconSize: [30, 30]
//         })

//         window.L.marker([providerProfile.locationLat, providerProfile.locationLng], { icon: providerIcon }).addTo(map)
//         window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)

//         // Fetch Route from OSRM
//         try {
//             const response = await fetch(
//                 `https://router.project-osrm.org/route/v1/driving/${providerProfile.locationLng},${providerProfile.locationLat};${userLocation.lng},${userLocation.lat}?overview=full&geometries=geojson`
//             )
//             const data = await response.json()

//             if (data.routes && data.routes.length > 0) {
//                 const route = data.routes[0]
//                 const routeLine = window.L.geoJSON(route.geometry, {
//                     style: { color: '#5B21B6', weight: 4, opacity: 0.7 }
//                 }).addTo(map)

//                 // Format distance
//                 if (route.distance < 1000) {
//                     setDistance(`${Math.round(route.distance)}m`)
//                 } else {
//                     setDistance(`${(route.distance / 1000).toFixed(1)}km`)
//                 }

//                 map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
//             } else {
//                 // Fallback to straight line
//                 const line = window.L.polyline([
//                     [providerProfile.locationLat, providerProfile.locationLng],
//                     [userLocation.lat, userLocation.lng]
//                 ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
//                 map.fitBounds(line.getBounds(), { padding: [50, 50] })
//             }
//         } catch (error) {
//             console.error('Routing error:', error)
//             // Fallback to straight line
//             const line = window.L.polyline([
//                 [providerProfile.locationLat, providerProfile.locationLng],
//                 [userLocation.lat, userLocation.lng]
//             ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
//             map.fitBounds(line.getBounds(), { padding: [50, 50] })
//         }

//         mapInstanceRef.current = map
//     }

//     const handleInitiateStartJob = async () => {
//         setShowOtpInput(true)
//     }

//     const handleStartJob = async () => {
//         if (otpInput.length !== 6) return
//         try {
//             await bookingService.startService(booking!.id, otpInput)
//             toast.success('Service Started!')
//             fetchData()
//             navigate('/dashboard')
//         } catch (error) {
//             toast.error('Invalid OTP')
//         }
//     }

//     const handleCompleteJob = async () => {
//         try {
//             await bookingService.completeBooking(booking!.id)
//             toast.success('Service Completed!')
//             navigate('/dashboard')
//         } catch (error) {
//             toast.error('Failed to complete')
//         }
//     }

//     const handleAccept = async () => {
//         try {
//             await bookingService.acceptBooking(booking!.id)
//             toast.success('Booking accepted!')
//             fetchData() // Refresh to show Start Job buttons
//         } catch (error: any) {
//             toast.error(error.response?.data?.message || 'Failed to accept booking')
//         }
//     }

//     const handleReject = async () => {
//         if (!window.confirm('Are you sure you want to decline this job?')) return
//         try {
//             await bookingService.rejectBooking(booking!.id)
//             toast.success('Booking rejected')
//             navigate('/dashboard')
//         } catch (error: any) {
//             toast.error(error.response?.data?.message || 'Failed to reject booking')
//         }
//     }

//     if (isLoading || !booking) return <TrackingPageSkeleton />

//     return (
//         <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
//                 {/* Left Panel: Details */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
//                     <div className="mb-6">
//                         <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Job</h1>
//                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
//                             {booking.status.replace('_', ' ')}
//                         </span>
//                     </div>

//                     <div className="space-y-6 flex-1">
//                         {/* Customer Info */}
//                         <div className="bg-gray-50 rounded-xl p-4">
//                             <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details</h3>
//                             <div className="flex items-start gap-3 mb-3">
//                                 <div className="bg-white p-2 rounded-lg shadow-sm">
//                                     <span className="material-symbols-outlined text-gray-600">person</span>
//                                 </div>
//                                 <div>
//                                     <p className="font-semibold text-gray-900">{booking.user.name}</p>
//                                     <p className="text-sm text-gray-500">Customer</p>
//                                 </div>
//                             </div>

//                             {booking.user.phone && (
//                                 <div className="flex items-start gap-3 mb-3">
//                                     <div className="bg-white p-2 rounded-lg shadow-sm">
//                                         <PhoneIcon size={20} color="#4B5563" />
//                                     </div>
//                                     <div>
//                                         <p className="font-semibold text-gray-900">{booking.user.phone}</p>
//                                         <a href={`tel:${booking.user.phone}`} className="text-xs text-blue-600 hover:underline">Call Customer</a>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="flex items-start gap-3">
//                                 <div className="bg-white p-2 rounded-lg shadow-sm">
//                                     <MapPinIcon size={20} color="#4B5563" />
//                                 </div>
//                                 <div>
//                                     <p className="font-semibold text-gray-900">{booking.user.city || 'Location Pending'}</p>
//                                     <p className="text-sm text-gray-500">Service Location</p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Job Details */}
//                         <div>
//                             <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Job Details</h3>
//                             <p className="text-lg font-medium text-gray-900 mb-1">{booking.serviceType}</p>
//                             <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">{booking.note || 'No notes provided'}</p>
//                         </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="mt-6 pt-6 border-t border-gray-100">
//                         {/* Show Start Job for ACCEPTED or IN_PROGRESS (before start) */}
//                         {/* Show Accept/Decline for REQUESTED */}
//                         {booking.status === 'REQUESTED' ? (
//                             <div className="flex gap-3">
//                                 <Button onClick={handleReject} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
//                                     Decline
//                                 </Button>
//                                 <Button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-700">
//                                     Accept Job
//                                 </Button>
//                             </div>
//                         ) : (booking.status === 'ACCEPTED' || (booking.status === 'IN_PROGRESS' && !booking.startedAt)) ? (
//                             showOtpInput ? (
//                                 <div className="space-y-3">
//                                     <input
//                                         type="text"
//                                         className="w-full p-3 border rounded-xl text-center text-lg tracking-widest"
//                                         placeholder="Enter 6-digit OTP"
//                                         maxLength={6}
//                                         value={otpInput}
//                                         onChange={(e) => setOtpInput(e.target.value)}
//                                     />
//                                     <div className="flex gap-2">
//                                         <Button variant="secondary" onClick={() => setShowOtpInput(false)} className="flex-1">Cancel</Button>
//                                         <Button onClick={handleStartJob} className="flex-1">Verify & Start</Button>
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <Button onClick={handleInitiateStartJob} className="w-full py-4 text-lg">
//                                     Start Job
//                                 </Button>
//                             )
//                         ) : booking.status === 'IN_PROGRESS' && booking.startedAt ? (
//                             <Button onClick={handleCompleteJob} variant="primary" className="w-full py-4 text-lg bg-green-600 hover:bg-green-700">
//                                 Complete Job
//                             </Button>
//                         ) : null}

//                         <button
//                             onClick={() => openChat(booking.user.id, booking.user.name)}
//                             className="mt-3 block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
//                         >
//                             <span className="material-symbols-outlined">chat</span>
//                             Message Customer
//                         </button>

//                         {userLocation && providerProfile?.locationLat && (
//                             <a
//                                 href={`https://www.google.com/maps/dir/${providerProfile.locationLat},${providerProfile.locationLng}/${userLocation.lat},${userLocation.lng}`}
//                                 target="_blank"
//                                 rel="noreferrer"
//                                 className="mt-3 block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
//                             >
//                                 Open in Google Maps
//                             </a>
//                         )}
//                     </div>
//                 </div>

//                 {/* Right Panel: Map */}
//                 <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative min-h-[400px]">
//                     {providerProfile?.locationLat && userLocation ? (
//                         <>
//                             <div ref={mapContainerRef} className="absolute inset-0 z-0" />
//                             {/* Distance Badge */}
//                             {distance && (
//                                 <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
//                                     <span className="material-symbols-outlined text-blue-600">distance</span>
//                                     <div>
//                                         <p className="text-xs text-gray-500 font-medium uppercase">Distance</p>
//                                         <p className="text-lg font-bold text-gray-900">{distance}</p>
//                                     </div>
//                                 </div>
//                             )}
//                         </>
//                     ) : (
//                         <div className="flex items-center justify-center h-full text-gray-400">
//                             <p>Map unavailable (Missing location data)</p>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { adminService } from '../services/adminService'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { PageLoadingSkeleton } from '../components/ui/Loader'
// import { EyeIcon, CheckIcon, XCircleIcon } from '../components/icons/CustomIcons'
// import type { ProviderProfile } from '../types'

// export const AdminDashboard = () => {
//   const navigate = useNavigate()
//   const [pendingProviders, setPendingProviders] = useState<ProviderProfile[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     fetchPendingProviders()
//   }, [])

//   const fetchPendingProviders = async () => {
//     try {
//       setLoading(true)
//       const providers = await adminService.listPendingProviders()
//       setPendingProviders(providers)
//     } catch (err) {
//       console.error('Failed to fetch pending providers:', err)
//       setError('Failed to load pending providers')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleViewProvider = (providerId: number) => {
//     navigate(`/admin/providers/${providerId}`)
//   }

//   if (loading) {
//     return <PageLoadingSkeleton />
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <p className="text-error mb-4">{error}</p>
//           <Button onClick={fetchPendingProviders}>Retry</Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Dashboard</h1>
//         <p className="text-text-secondary">Review and manage provider applications</p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Pending Provider Applications</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {pendingProviders.length === 0 ? (
//             <div className="text-center py-12">
//               <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
//                 <CheckIcon size={24} color="#5B21B6" />
//               </div>
//               <h3 className="text-lg font-medium text-text-primary mb-1">No pending applications</h3>
//               <p className="text-text-secondary">All provider applications have been reviewed.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {pendingProviders.map((provider) => (
//                 <div
//                   key={provider.id}
//                   className="flex items-center justify-between p-5 border border-border rounded-xl hover:bg-background-app transition-colors"
//                 >
//                   <div>
//                     <h3 className="font-medium text-text-primary">{provider.userId}</h3>
//                     <p className="text-sm text-text-secondary">{provider.serviceType}</p>
//                     <p className="text-xs text-text-muted mt-1">
//                       Submitted: {new Date().toLocaleDateString()}
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handleViewProvider(provider.id)}
//                     >
//                       <EyeIcon size={16} color="#5B21B6" className="mr-2" />
//                       Review
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useState, useRef } from 'react';
// import { Upload, Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
// import { toast } from 'react-hot-toast';
// import { analyzeProblem, ProblemAnalysisResponse } from '../services/aiService';
// import { useNavigate } from 'react-router-dom';

// export function AISolver() {
//     const [image, setImage] = useState<File | null>(null);
//     const [preview, setPreview] = useState<string | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [result, setResult] = useState<ProblemAnalysisResponse | null>(null);
//     const [isDragActive, setIsDragActive] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const navigate = useNavigate();

//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             processFile(file);
//         }
//     };

//     const processFile = (file: File) => {
//         if (!file.type.startsWith('image/')) {
//             toast.error('Please upload an image file');
//             return;
//         }
//         setImage(file);
//         setPreview(URL.createObjectURL(file));
//         setResult(null);
//     };

//     const handleDragOver = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragActive(true);
//     };

//     const handleDragLeave = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragActive(false);
//     };

//     const handleDrop = (e: React.DragEvent) => {
//         e.preventDefault();
//         setIsDragActive(false);
//         const file = e.dataTransfer.files?.[0];
//         if (file) {
//             processFile(file);
//         }
//     };

//     const triggerFileInput = () => {
//         fileInputRef.current?.click();
//     };

//     const handleAnalyze = async () => {
//         if (!image) return;

//         setLoading(true);
//         try {
//             const data = await analyzeProblem(image);
//             setResult(data);
//             toast.success('Analysis complete!');
//         } catch (error) {
//             console.error(error);
//             toast.error('Failed to analyze the image. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-4xl mx-auto space-y-8">

//                 {/* Header */}
//                 <div className="text-center">
//                     <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
//                         AI Repair Assistant
//                     </h1>
//                     <p className="mt-4 text-lg text-gray-500">
//                         Upload a photo of your household problem, and our AI will identify the issue and find the right expert for you.
//                     </p>
//                 </div>

//                 {/* Upload Section */}
//                 <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 border border-gray-100">
//                     <div
//                         onClick={triggerFileInput}
//                         onDragOver={handleDragOver}
//                         onDragLeave={handleDragLeave}
//                         onDrop={handleDrop}
//                         className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
//                             }`}
//                     >
//                         <input
//                             type="file"
//                             ref={fileInputRef}
//                             onChange={handleFileChange}
//                             accept="image/*"
//                             className="hidden"
//                         />

//                         {preview ? (
//                             <div className="relative inline-block">
//                                 <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-md mx-auto" />
//                                 <p className="mt-4 text-sm text-gray-500">Click or Drag to replace</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 <div className="mx-auto h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
//                                     <Upload className="h-8 w-8" />
//                                 </div>
//                                 <div>
//                                     <p className="text-lg font-medium text-gray-900">
//                                         Drop your image here, or <span className="text-blue-600">browse</span>
//                                     </p>
//                                     <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <div className="mt-6 flex justify-center">
//                         <button
//                             onClick={handleAnalyze}
//                             disabled={!image || loading}
//                             className={`flex items-center space-x-2 px-8 py-3 rounded-full text-white font-medium text-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!image || loading
//                                     ? 'bg-gray-300 cursor-not-allowed'
//                                     : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'
//                                 }`}
//                         >
//                             {loading ? (
//                                 <>
//                                     <Loader2 className="h-5 w-5 animate-spin" />
//                                     <span>Analyzing...</span>
//                                 </>
//                             ) : (
//                                 <>
//                                     <Search className="h-5 w-5" />
//                                     <span>Analyze Problem</span>
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </div>

//                 {/* Results Section */}
//                 {result && (
//                     <div className="space-y-8 animate-fade-in-up">

//                         {/* Analysis Card */}
//                         <div className="bg-white rounded-2xl shadow-lg border-l-4 border-indigo-500 p-6 overflow-hidden relative">
//                             <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 z-0"></div>
//                             <div className="relative z-10 flex flex-col md:flex-row md:items-start md:space-x-4">
//                                 <div className="flex-shrink-0">
//                                     <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
//                                         <CheckCircle className="h-6 w-6" />
//                                     </div>
//                                 </div>
//                                 <div className="flex-1 mt-4 md:mt-0">
//                                     <h3 className="text-xl font-bold text-gray-900">Diagnosis Complete</h3>
//                                     <div className="mt-2 space-y-2">
//                                         <div className="flex items-start">
//                                             <span className="font-semibold w-24 text-gray-600 uppercase text-xs tracking-wider mt-1">Issue:</span>
//                                             <p className="text-gray-800 text-lg">{result.issueDescription}</p>
//                                         </div>
//                                         <div className="flex items-center">
//                                             <span className="font-semibold w-24 text-gray-600 uppercase text-xs tracking-wider">Expertise:</span>
//                                             <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
//                                                 {result.detectedServiceType}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Recommendations */}
//                         <h2 className="text-2xl font-bold text-gray-900">Recommended Experts</h2>

//                         {result.recommendedProviders.length === 0 ? (
//                             <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-center space-x-3">
//                                 <AlertCircle className="h-6 w-6 text-yellow-600" />
//                                 <p className="text-yellow-700">No specific providers found online for this category right now. You can try browsing all providers.</p>
//                             </div>
//                         ) : (
//                             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                                 {result.recommendedProviders.map((provider) => (
//                                     <div
//                                         key={provider.id}
//                                         className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
//                                         onClick={() => navigate(`/select-provider?preselect=${provider.id}`)}
//                                     >
//                                         <div className="aspect-w-16 aspect-h-9 bg-gray-200 h-48 overflow-hidden">
//                                             <img
//                                                 src={provider.profilePhotoUrl || `https://ui-avatars.com/api/?name=${provider.user.firstName}+${provider.user.lastName}&background=random`}
//                                                 alt="Provider"
//                                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                                             />
//                                         </div>
//                                         <div className="p-5">
//                                             <div className="flex justify-between items-start">
//                                                 <div>
//                                                     <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
//                                                         {provider.user.firstName} {provider.user.lastName}
//                                                     </h3>
//                                                     <p className="text-sm text-gray-500">{provider.user.city}</p>
//                                                 </div>
//                                                 <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
//                                                     <span className="text-yellow-600 font-bold text-sm">★</span>
//                                                     <span className="ml-1 text-gray-700 font-medium text-sm">{provider.rating.toFixed(1)}</span>
//                                                 </div>
//                                             </div>

//                                             <div className="mt-4 flex flex-wrap gap-2">
//                                                 <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium uppercase">
//                                                     {provider.serviceType}
//                                                 </span>
//                                                 <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium">
//                                                     Available
//                                                 </span>
//                                             </div>

//                                             <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
//                                                 <span className="text-lg font-bold text-gray-900">${provider.basePrice}<span className="text-sm font-normal text-gray-500">/hr</span></span>
//                                                 <button className="text-blue-600 text-sm font-medium hover:underline">View Profile →</button>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// import { useEffect, useState } from 'react'
// import { Card, CardContent } from '../components/ui/Card'
// import { BookingsSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import { providerService } from '../services/providerService'
// import { useAuth } from '../contexts/AuthContext'
// import { useChat } from '../contexts/ChatContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import toast from 'react-hot-toast'
// import type { Booking, BookingStatus, ServiceType, ProviderProfile, User } from '../types'
// import {
//   CalendarIcon,
//   UserIcon,
//   ClockIcon,
//   DollarSignIcon,
//   CleaningIcon,
//   PlumbingIcon,
//   LightningIcon,
//   HistoryIcon,
//   StarIcon,
// } from '../components/icons/CustomIcons'
// import { format, isToday, isTomorrow, parseISO } from 'date-fns'
// import { Modal } from '../components/ui/Modal'
// import { Textarea } from '../components/ui/Textarea'
// import { Button } from '../components/ui/Button'
// import { reviewService } from '../services/reviewService'

// // Service type mapping with icons and labels
// const SERVICE_MAPPING: Record<ServiceType, { label: string; icon: any; color: string }> = {
//   CLEANER: { label: 'Cleaning', icon: CleaningIcon, color: '#3B82F6' },
//   PLUMBER: { label: 'Plumbing', icon: PlumbingIcon, color: '#F97316' },
//   ELECTRICIAN: { label: 'Electrical', icon: LightningIcon, color: '#FCD34D' },
//   LAUNDRY: { label: 'Laundry', icon: CleaningIcon, color: '#3B82F6' },
//   OTHER: { label: 'Other', icon: PlumbingIcon, color: '#F97316' },
// }

// // Status configuration
// const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string }> = {
//   REQUESTED: { label: 'Scheduled', bg: '#F3F4F6', text: '#6B7280' },
//   ACCEPTED: { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
//   REJECTED: { label: 'Declined', bg: '#FEE2E2', text: '#DC2626' },
//   CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
//   COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#16A34A' },
//   IN_PROGRESS: { label: 'In Progress', bg: '#DBEAFE', text: '#2563EB' },
// }

// type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

// // Format booking ID as QF-xxxxx
// const formatBookingId = (id: number): string => {
//   return `QF-${String(id).padStart(5, '0')}`
// }

// // Format date display
// const formatBookingDate = (date: Date | string): string | null => {
//   try {
//     if (!date) return null

//     const dateObj = typeof date === 'string' ? parseISO(date) : date

//     // Check if date is valid
//     if (!dateObj || isNaN(dateObj.getTime())) {
//       return null
//     }

//     if (isToday(dateObj)) {
//       return `Today, ${format(dateObj, 'MMM d')}`
//     } else if (isTomorrow(dateObj)) {
//       return `Tomorrow, ${format(dateObj, 'MMM d')}`
//     } else {
//       return format(dateObj, 'MMM d, yyyy')
//     }
//   } catch (error) {
//     console.error('Error formatting date:', error, date)
//     return null
//   }
// }

// // Format time range for booking
// const formatBookingTime = (booking: Booking): string | null => {
//   try {
//     let startDate: Date | null = null

//     // If booking is accepted, use acceptedAt as service start time
//     if (booking.acceptedAt) {
//       const parsed = parseISO(booking.acceptedAt)
//       if (!isNaN(parsed.getTime())) {
//         startDate = parsed
//       }
//     } else if (booking.createdAt) {
//       // Otherwise use createdAt
//       const parsed = parseISO(booking.createdAt)
//       if (!isNaN(parsed.getTime())) {
//         startDate = parsed
//       }
//     }

//     // Check if date is valid
//     if (!startDate || isNaN(startDate.getTime())) {
//       return null
//     }

//     const startTime = format(startDate, 'h:mm a')
//     return startTime
//   } catch (error) {
//     console.error('Error formatting time:', error, booking)
//     return null
//   }
// }

// // Get booking service date (preferred date or created date)
// const getBookingServiceDate = (booking: Booking): Date => {
//   try {
//     const dateString = booking.acceptedAt || booking.createdAt
//     if (!dateString) {
//       // Return current date as fallback
//       return new Date()
//     }
//     const date = parseISO(dateString)
//     // Check if date is valid
//     if (!date || isNaN(date.getTime())) {
//       return new Date()
//     }
//     return date
//   } catch (error) {
//     console.error('Error parsing booking date:', error, booking)
//     return new Date()
//   }
// }

// // Get service info
// const getServiceInfo = (serviceType: ServiceType) => {
//   return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
// }

// // Helper structure for grouped bookings
// interface BookingGroup {
//   id: string
//   isGroup: true
//   bookings: Booking[]
//   provider: User
//   serviceType: ServiceType
//   note?: string
//   earliestDate: Date | null
//   latestDate: Date | null
//   status: BookingStatus
// }

// export const Bookings = () => {
//   const { user } = useAuth()
//   const { openChat } = useChat()
//   const [bookings, setBookings] = useState<Booking[]>([])
//   const [providerProfiles, setProviderProfiles] = useState<ProviderProfile[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }, [user])

//   /* Auto-refresh on booking-related notifications */
//   const { notifications } = useNotifications()
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed')

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing dashboard...', latest.id)
//           const fetchData = async () => {
//             if (!user) return
//             try {
//               if (user.role === 'USER') {
//                 const bookings = await bookingService.getBookingsByUser(user.id)

//                 // Find active booking (ACCEPTED or IN_PROGRESS status)
//                 // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//                 const active = bookings.find(b =>
//                   b.status === 'IN_PROGRESS' ||
//                   (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//                 )
//                 setActiveBooking(active || null)
//               }
//             } catch (error) {
//               console.error('Failed to fetch data:', error)
//             }
//           }
//           fetchData()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   const getStatusText = () => {
//     if (!activeBooking) return 'No active service'

//     switch (trackingStatus) {
//       case 'on_the_way':
//         return `${activeBooking.provider.name.split(' ')[0]} is on the way.`
//       case 'reached':
//         return `${activeBooking.provider.name.split(' ')[0]} has reached your location.`
//       case 'arrived':
//         return `${activeBooking.provider.name.split(' ')[0]} has arrived.`
//       default:
//         return `${activeBooking.provider.name.split(' ')[0]} is on the way.`
//     }
//   }

//   const handleBookingTypeClick = (type: 'single' | 'multiple') => {
//     if (type === 'single') {
//       navigate('/providers')
//     } else {
//       navigate('/select-provider', { state: { bookingType: type } })
//     }
//   }

//   if (isLoading) {
//     return <DashboardSkeleton />
//   }

//   if (user?.role === 'PROVIDER') {
//     // Render ProviderDashboard for providers
//     return <ProviderDashboard user={user as any} />
//   }

//   // Customer Dashboard - Premium Design
//   return (
//     <div className="flex flex-col gap-8">
//       {/* Greeting Section */}
//       <div>
//         <p className="text-sm font-medium text-text-muted mb-1">
//           {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
//         </p>
//         <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">
//           What do you need help with today?
//         </h1>
//       </div>

//       {/* Booking Options */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div
//           className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-12 text-center shadow-sm border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-64"
//           onClick={() => handleBookingTypeClick('single')}
//         >
//           <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
//             <span className="material-symbols-outlined text-3xl">schedule</span>
//           </div>
//           <div>
//             <h3 className="text-lg font-bold text-text-dark mb-1">Single Booking</h3>
//             <p className="text-sm text-text-muted max-w-xs mx-auto">Book a one-time service for a quick fix.</p>
//           </div>
//           <div className="mt-4 size-8 rounded-full border border-slate-200 flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-colors">
//             <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
//           </div>
//         </div>

//         <div
//           className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-12 text-center shadow-sm border border-slate-100 hover:border-accent-teal/30 hover:shadow-md transition-all cursor-pointer h-64"
//           onClick={() => navigate('/book/multiple-dates')}
//         >
//           <div className="size-14 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal mb-2 group-hover:scale-110 transition-transform duration-300">
//             <span className="material-symbols-outlined text-3xl">calendar_view_month</span>
//           </div>
//           <div>
//             <h3 className="text-lg font-bold text-text-dark mb-1">Multiple Booking</h3>
//             <p className="text-sm text-text-muted max-w-xs mx-auto">Create a package for full house maintenance.</p>
//           </div>
//           <div className="mt-4 size-8 rounded-full border border-slate-200 flex items-center justify-center text-text-muted group-hover:bg-accent-teal group-hover:border-accent-teal group-hover:text-white transition-colors">
//             <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
//           </div>
//         </div>
//       </div>



//       {/* Active Service */}
//       {activeBooking && (
//         <div className="bg-primary rounded-3xl p-6 md:p-8 relative overflow-hidden">
//           <div className="relative z-10">
//             <h3 className="text-white text-xl font-bold mb-2">Active Service</h3>
//             <p className="text-white/80 text-sm mb-6">{getStatusText()}</p>
//             <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 w-fit">
//               <div className="size-10 rounded-full bg-white overflow-hidden flex items-center justify-center">
//                 <span className="text-primary font-bold">
//                   {activeBooking.provider.name.charAt(0).toUpperCase()}
//                 </span>
//               </div>
//               <div>
//                 <p className="text-white font-medium text-sm">{activeBooking.provider.name}</p>
//                 <p className="text-white/70 text-xs">Professional</p>
//               </div>
//             </div>
//             <button
//               className="mt-6 rounded-lg bg-white py-2 px-4 text-sm font-medium text-primary hover:bg-primary-light transition-colors"
//               onClick={() => navigate(`/track-service/${activeBooking.id}`)}
//             >
//               Track Service
//             </button>
//           </div>
//           <div className="absolute -right-10 -bottom-10 opacity-20">
//             <span className="material-symbols-outlined text-[120px] text-white">location_on</span>
//           </div>
//         </div>
//       )}


//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { EarningsSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import { providerService } from '../services/providerService'
// import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns'
// import type { Booking } from '../types'
// import {
//   TrendingUpIcon,
//   CalendarIcon,
//   WalletIcon
// } from '../components/icons/CustomIcons'

// interface EarningsSummary {
//   totalEarnings: number
//   todayEarnings: number
//   weeklyEarnings: number
//   monthlyEarnings: number
//   totalJobs: number
//   completedJobs: number
//   avgEarningsPerJob: number
// }

// // Helper function to extract price from booking note
// const extractPriceFromNote = (note?: string): number | null => {
//   if (!note) return null
//   // Match patterns like "₹500" or "- ₹500/" in the note
//   const match = note.match(/₹(\d+)/)
//   return match ? parseInt(match[1], 10) : null
// }

// const Earnings = () => {
//   const { user } = useAuth()
//   const [isLoading, setIsLoading] = useState(true)
//   const [bookings, setBookings] = useState<Booking[]>([])
//   const [basePrice, setBasePrice] = useState(0)
//   const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
//     totalEarnings: 0,
//     todayEarnings: 0,
//     weeklyEarnings: 0,
//     monthlyEarnings: 0,
//     totalJobs: 0,
//     completedJobs: 0,
//     avgEarningsPerJob: 0
//   })

//   useEffect(() => {
//     if (user?.id) {
//       fetchData()
//     }
//   }, [user?.id])

//   const fetchData = async () => {
//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profile in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         bookingService.getBookingsByProvider(user!.id),
//         providerService.getAllProviders()
//       ])

//       const currentProvider = providersData.find(p => p.userId === user!.id)
//       const basePrice = currentProvider?.basePrice || 0

//       setBookings(bookingsData)
//       calculateEarningsSummary(bookingsData, basePrice)
//     } catch (error) {
//       console.error('Failed to fetch earnings data:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const calculateEarningsSummary = (bookingsData: Booking[], fallbackPrice: number) => {
//     const completedBookings = bookingsData.filter(b => b.status === 'COMPLETED')

//     // Calculate earnings based on actual booking prices from notes
//     const calculateEarnings = (bookings: Booking[]) => {
//       return bookings.reduce((total, booking) => {
//         const price = extractPriceFromNote(booking.note) || fallbackPrice
//         return total + price
//       }, 0)
//     }

//     const todayEarnings = calculateEarnings(
//       completedBookings.filter(b => b.completedAt && isToday(parseISO(b.completedAt)))
//     )

//     const weeklyEarnings = calculateEarnings(
//       completedBookings.filter(b => b.completedAt && isThisWeek(parseISO(b.completedAt)))
//     )

//     const monthlyEarnings = calculateEarnings(
//       completedBookings.filter(b => b.completedAt && isThisMonth(parseISO(b.completedAt)))
//     )

//     const totalEarnings = calculateEarnings(completedBookings)
//     const avgEarningsPerJob = completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0

//     setBasePrice(fallbackPrice)
//     setEarningsSummary({
//       totalEarnings,
//       todayEarnings,
//       weeklyEarnings,
//       monthlyEarnings,
//       totalJobs: bookingsData.length,
//       completedJobs: completedBookings.length,
//       avgEarningsPerJob
//     })
//   }

//   if (isLoading) {
//     return <EarningsSkeleton />
//   }

//   const recentEarnings = bookings
//     .filter(b => b.status === 'COMPLETED' && b.completedAt)
//     .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
//     .slice(0, 5)

//   return (
//     <div className="flex flex-col gap-8">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight mb-2">
//           Earnings Dashboard
//         </h1>
//         <p className="text-text-muted">
//           Track your income, completed jobs, and performance metrics
//         </p>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">Total Earnings</p>
//             <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.totalEarnings.toLocaleString()}</h3>
//           </div>
//           <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
//             <WalletIcon size={24} />
//           </div>
//         </div>

//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-teal/30 transition-all">
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">Today</p>
//             <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.todayEarnings.toLocaleString()}</h3>
//           </div>
//           <div className="size-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal group-hover:scale-110 transition-transform">
//             <CalendarIcon size={24} />
//           </div>
//         </div>

//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-orange/30 transition-all">
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">This Week</p>
//             <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.weeklyEarnings.toLocaleString()}</h3>
//           </div>
//           <div className="size-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center text-accent-orange group-hover:scale-110 transition-transform">
//             <TrendingUpIcon size={24} />
//           </div>
//         </div>

//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-navy/30 transition-all">
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">This Month</p>
//             <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.monthlyEarnings.toLocaleString()}</h3>
//           </div>
//           <div className="size-12 rounded-2xl bg-accent-navy/10 flex items-center justify-center text-accent-navy group-hover:scale-110 transition-transform">
//             <TrendingUpIcon size={24} />
//           </div>
//         </div>
//       </div>

//       {/* Performance Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
//               <TrendingUpIcon size={20} />
//             </div>
//             <h3 className="font-semibold text-text-dark">Performance</h3>
//           </div>          <div className="space-y-4">
//             <div>
//               <p className="text-sm text-text-muted">Total Jobs</p>
//               <p className="text-xl font-bold text-text-dark">{earningsSummary.totalJobs}</p>
//             </div>
//             <div>
//               <p className="text-sm text-text-muted">Completed Jobs</p>
//               <p className="text-xl font-bold text-text-dark">{earningsSummary.completedJobs}</p>
//             </div>
//             <div>
//               <p className="text-sm text-text-muted">Completion Rate</p>
//               <p className="text-xl font-bold text-text-dark">
//                 {earningsSummary.totalJobs > 0
//                   ? Math.round((earningsSummary.completedJobs / earningsSummary.totalJobs) * 100)
//                   : 0}%
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="size-10 rounded-xl bg-accent-teal/10 flex items-center justify-center text-accent-teal">
//                 <WalletIcon size={20} />
//               </div>
//               <h3 className="font-semibold text-text-dark">Earnings Overview</h3>
//             </div>
//           </div>
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-text-muted">Avg. Earnings per Job</p>
//               <p className="text-xl font-bold text-text-dark">₹{earningsSummary.avgEarningsPerJob.toFixed(2)}</p>
//             </div>
//             <div>
//               <p className="text-sm text-text-muted">Top Performing Period</p>
//               <p className="text-xl font-bold text-text-dark">
//                 {earningsSummary.todayEarnings > earningsSummary.weeklyEarnings && earningsSummary.todayEarnings > earningsSummary.monthlyEarnings
//                   ? "Today"
//                   : earningsSummary.weeklyEarnings > earningsSummary.monthlyEarnings
//                     ? "This Week"
//                     : "This Month"}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Recent Earnings */}
//       <div className="bg-card rounded-3xl p-6 border border-slate-100 shadow-sm">
//         <h3 className="text-lg font-semibold text-text-dark mb-4">Recent Completed Jobs</h3>
//         {recentEarnings.length > 0 ? (
//           <div className="space-y-4">
//             {recentEarnings.map((booking) => (
//               <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
//                 <div>
//                   <p className="font-medium text-text-dark">
//                     {booking.serviceType.charAt(0) + booking.serviceType.slice(1).toLowerCase()}
//                   </p>
//                   <p className="text-sm text-text-muted">
//                     Completed on {booking.completedAt ? format(parseISO(booking.completedAt), 'MMM d, yyyy') : 'Unknown date'}
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-semibold text-text-dark">₹{extractPriceFromNote(booking.note) || basePrice}</p>
//                   <p className="text-sm text-success">+ ₹{extractPriceFromNote(booking.note) || basePrice} earned</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-8">
//             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
//               <WalletIcon size={24} className="text-primary" />
//             </div>
//             <h4 className="font-medium text-text-dark mb-1">No completed jobs yet</h4>
//             <p className="text-sm text-text-muted">
//               Your earnings will appear here once you complete jobs
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default Earnings

// import { useNavigate } from 'react-router-dom'
// import { useState, useEffect } from 'react'
// import { providerService } from '../services/providerService'
// import { reviewService } from '../services/reviewService'
// import type { ProviderProfile, Review } from '../types'

// interface Stats {
//   activeProviders: number;
//   jobsCompleted: number;
//   averageRating: number;
//   satisfactionRate: number;
// }

// export const LandingPage = () => {
//   const navigate = useNavigate()
//   const [stats, setStats] = useState<Stats>({
//     activeProviders: 40, // default fallback
//     jobsCompleted: 15000,
//     averageRating: 4.8,
//     satisfactionRate: 98
//   });
//   const [recentReviews, setRecentReviews] = useState<Review[]>([])
//   const [featuredProvider, setFeaturedProvider] = useState<ProviderProfile | null>(null)

//   useEffect(() => {
//     const fetchStats = async (lat?: number, lng?: number) => {
//       try {
//         let url = `${import.meta.env.VITE_API_BASE || '/api'}/stats`;
//         if (lat && lng) {
//           url += `?lat=${lat}&lng=${lng}`;
//         }
//         const response = await fetch(url);
//         if (response.ok) {
//           const data = await response.json();
//           setStats(data);
//         }
//       } catch (error) {
//         console.error('Failed to fetch stats:', error);
//       }
//     };

//     const fetchRealData = async () => {
//       try {
//         // Fetch reviews
//         const reviews = await reviewService.getRecentReviews(4)
//         if (Array.isArray(reviews)) {
//           setRecentReviews(reviews)
//         } else {
//           console.warn('Expected array for reviews but got:', typeof reviews)
//           setRecentReviews([])
//         }

//         // Fetch providers and pick a random high-rated one to feature
//         const providers = await providerService.getAllProviders()
//         if (providers.length > 0) {
//           // Filter for ratings >= 4.5
//           const topPros = providers.filter(p => p.rating >= 4.5)
//           const pool = topPros.length > 0 ? topPros : providers
//           const randomPro = pool[Math.floor(Math.random() * pool.length)]
//           setFeaturedProvider(randomPro)

//           // Update stats with real count
//           setStats(prev => ({ ...prev, activeProviders: providers.length }))
//         }
//       } catch (error) {
//         console.error('Failed to fetch landing page data', error)
//       }
//     }

//     // Fetch stats without location initially to avoid browser violation
//     fetchStats();
//     fetchRealData();

//     // We can add a "Locate Me" button later if needed
//   }, []);

//   const handleBookNow = () => {
//     navigate('/login')
//   }

//   const handleLogin = () => {
//     navigate('/login')
//   }

//   return (
//     <div className="relative flex flex-col min-h-screen w-full bg-slate-50 font-sans text-slate-600 antialiased overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-700">
//       {/* Sticky Navbar with Dashboard Gradient */}
//       <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] shadow-lg shadow-indigo-200/20">
//         <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-8">
//           <div className="flex items-center gap-3">
//             <div className="size-9 text-white bg-white/20 rounded-xl p-1.5 backdrop-blur-sm border border-white/20 shadow-inner">
//               <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor"></path>
//               </svg>
//             </div>
//             <h2 className="text-white text-2xl font-bold tracking-tight">QuickFix</h2>
//           </div>

//           <div className="hidden md:flex flex-1 justify-end items-center gap-8">
//             <button
//               onClick={handleLogin}
//               className="px-6 h-10 rounded-full bg-white text-[#7C3AED] font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/10 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
//               Try Now
//             </button>
//           </div>
//           <div className="md:hidden flex items-center gap-3">
//             <button
//               onClick={handleLogin}
//               className="px-4 py-2 rounded-full bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/20">
//               Try Now
//             </button>
//             <div className="text-white cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors">
//               <span className="material-symbols-outlined block">menu</span>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="flex-1 flex flex-col items-center w-full">
//         {/* Hero Section */}
//         <section className="w-full relative overflow-hidden bg-white pb-16 pt-12 md:pb-32 md:pt-20 lg:pb-40 lg:pt-28">
//           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 pointer-events-none"></div>

//           <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-8">
//             <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
//               <div className="flex-1 flex flex-col gap-6 lg:gap-8 text-center lg:text-left max-w-2xl lg:max-w-none">
//                 <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 shadow-sm mx-auto lg:mx-0 backdrop-blur-sm">
//                   <span className="relative flex h-2.5 w-2.5">
//                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
//                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
//                   </span>
//                   <span className="text-xs font-semibold text-indigo-900 tracking-wide uppercase">Live: {stats.activeProviders} Pros available now</span>
//                 </div>

//                 <h1 className="text-slate-900 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
//                   Expert Help <br className="hidden lg:block" />
//                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#6366F1]" style={{ fontSize: 'inherit' }}>in 30 Mins.</span>
//                 </h1>

//                 <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
//                   Plumbing, Electrical, Cleaning. Guaranteed arrival time or the service is free. Experience the new standard in home services.
//                 </p>

//                 <div className="w-full max-w-lg mx-auto lg:mx-0">
//                   <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-sm font-medium text-slate-400">
//                     <span className="material-symbols-outlined text-indigo-500 text-lg">verified_user</span>
//                     <span>Fully Licensed & Insured Professionals</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex-1 w-full max-w-[600px] lg:max-w-none perspective-1000">
//                 {featuredProvider ? (
//                   <div className="relative group">
//                     <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] rounded-[2.5rem] rotate-3 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
//                     <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/20 aspect-[4/3] bg-slate-900 border-4 border-white transform transition-transform duration-500 hover:scale-[1.01]">
//                       <div
//                         className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-110"
//                         style={{ backgroundImage: `url(${featuredProvider.portfolioImages?.[0] ? `${import.meta.env.VITE_API_BASE || '/api'}${featuredProvider.portfolioImages[0]}` : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'})` }}
//                       >
//                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
//                       </div>

//                       <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
//                         <div className="relative">
//                           <div className="size-12 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-[#7C3AED]">
//                             {featuredProvider.profilePhotoUrl ? (
//                               <img src={featuredProvider.profilePhotoUrl} alt="Pro" className="w-full h-full object-cover" />
//                             ) : (
//                               <span className="material-symbols-outlined">bolt</span>
//                             )}
//                           </div>
//                           <div className="absolute -bottom-1 -right-1 size-5 bg-green-500 border-2 border-white rounded-full"></div>
//                         </div>
//                         <div>
//                           <p className="text-slate-900 font-bold text-sm">{(featuredProvider as any).displayName || 'Expert Pro'} is available</p>
//                           <p className="text-indigo-600 font-medium text-xs">4 mins away • {featuredProvider.serviceType}</p>
//                         </div>
//                         <div className="ml-auto flex flex-col items-end">
//                           <div className="flex text-yellow-500 text-xs">★★★★★</div>
//                           <span className="text-slate-400 text-[10px] font-medium">{featuredProvider.rating.toFixed(1)} ({featuredProvider.reviewCount || 100} jobs)</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   // Fallback if no provider loaded
//                   <div className="relative group">
//                     <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] bg-slate-100 flex items-center justify-center">
//                       <p className="text-slate-400">Loading top pros...</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Stats Row */}
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16 lg:mt-24">
//               {[
//                 { icon: 'check_circle', label: 'Jobs Completed', value: stats.jobsCompleted.toLocaleString() + '+' },
//                 { icon: 'timer', label: 'Avg Arrival', value: '22 min' },
//                 { icon: 'sentiment_satisfied', label: 'Satisfaction', value: stats.satisfactionRate + '%' },
//               ].map((stat, i) => (
//                 <div key={i} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all hover:-translate-y-1">
//                   <div className="mb-3 p-3 rounded-2xl bg-indigo-50 text-[#7C3AED]">
//                     <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
//                   </div>
//                   <span className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</span>
//                   <span className="text-sm font-medium text-slate-500 mt-1">{stat.label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Instant Services */}
//         <section className="w-full py-20 bg-slate-50 relative">
//           <div className="max-w-[1200px] mx-auto px-4 md:px-8">
//             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
//               <div>
//                 <span className="text-[#7C3AED] font-bold tracking-wider uppercase text-sm">Services</span>
//                 <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Whatever breaks, we fix.</h2>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
//               {[
//                 { icon: 'water_drop', name: 'Plumbing' },
//                 { icon: 'bolt', name: 'Electrical' },
//                 { icon: 'cleaning_services', name: 'Cleaning' },
//                 { icon: 'build', name: 'Assembly' },
//                 { icon: 'lock', name: 'Locksmith' },
//                 { icon: 'home_repair_service', name: 'Handyman' },
//               ].map((service, i) => (
//                 <button key={i} className="flex flex-col items-center justify-center gap-4 p-6 rounded-3xl bg-white border border-slate-150 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all hover:-translate-y-1 group">
//                   <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-300">
//                     <span className="material-symbols-outlined text-3xl">{service.icon}</span>
//                   </div>
//                   <span className="font-bold text-slate-700 group-hover:text-slate-900">{service.name}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* How It Works */}
//         <section id="how-it-works" className="w-full py-24 bg-white">
//           <div className="max-w-[1200px] mx-auto px-4 md:px-8">
//             <div className="text-center max-w-2xl mx-auto mb-16">
//               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How QuickFix Works</h2>
//               <p className="text-slate-500 text-lg">Three simple steps to get your home back to normal. No stress, no waiting.</p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-8 relative">
//               {/* Connecting Line (Desktop) */}
//               <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200"></div>

//               {[
//                 { step: 1, title: 'Request', desc: 'Choose your service and tell us what\'s wrong. Get an instant quote.' },
//                 { step: 2, title: 'Match', desc: 'Our algorithm finds the nearest top-rated pro in seconds.' },
//                 { step: 3, title: 'Relax', desc: 'Your pro arrives within 30 minutes. Pay only after you\'re satisfied.' }
//               ].map((item, i) => (
//                 <div key={i} className="relative flex flex-col items-center text-center gap-4 group">
//                   <div className="relative z-10 size-24 rounded-3xl bg-white border-4 border-slate-50 shadow-xl shadow-indigo-100/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
//                     <span className="text-4xl font-black text-[#7C3AED]">{item.step}</span>
//                   </div>
//                   <h3 className="text-xl font-bold text-slate-900 mt-2">{item.title}</h3>
//                   <p className="text-slate-500 leading-relaxed max-w-[280px]">{item.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* Call to Action / Map Teaser */}
//         <section className="w-full py-16 px-4 md:px-8">
//           <div className="max-w-[1200px] mx-auto relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/20 group">
//             <div
//               className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 opacity-50"
//             ></div>
//             <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/95 to-[#6366F1]/90"></div>

//             <div className="relative px-8 py-12 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10">
//               <div className="text-center md:text-left">
//                 <span className="inline-block py-1 px-3 rounded-lg bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">Live in your neighborhood</span>
//                 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{stats.activeProviders} Pros in your area</h2>
//                 <p className="text-indigo-100 text-lg max-w-xl">
//                   We've expanded our network. Average response time in your neighborhood is currently <span className="font-bold text-white underline decoration-white/30 decoration-2 underline-offset-4">14 minutes</span>.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Testimonials */}
//         <section id="reviews" className="w-full py-20 bg-slate-50">
//           <div className="max-w-[1200px] mx-auto px-4 md:px-8">
//             <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">What neighbors are saying</h2>
//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {Array.isArray(recentReviews) && recentReviews.length > 0 ? (
//                 recentReviews.map((review, i) => (
//                   <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:border-indigo-200 transition-colors">
//                     <div className="flex text-yellow-400 text-sm gap-0.5">
//                       {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
//                     </div>
//                     <p className="text-slate-600 italic font-medium leading-relaxed">"{review.comment || 'Great service!'}"</p>
//                     <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-50">
//                       <div className="size-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[#7C3AED] flex items-center justify-center font-bold text-sm">
//                         {review.posterName ? review.posterName[0].toUpperCase() : 'U'}
//                       </div>
//                       <div>
//                         <p className="font-bold text-slate-900 text-sm">{review.posterName || 'User'}</p>
//                         <p className="text-xs text-slate-400">Verified Customer</p>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className="col-span-4 text-center text-slate-500">No reviews yet. Be the first to try QuickFix!</p>
//               )}
//             </div>
//           </div>
//         </section>
//       </main>

//       {/* Footer */}
//       <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
//         <div className="max-w-[1200px] mx-auto px-4 md:px-8">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
//             <div className="space-y-6">
//               <div className="flex items-center gap-3 text-white">
//                 <div className="size-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-xl font-bold">Q</div>
//                 <span className="text-xl font-bold">QuickFix</span>
//               </div>
//               <p className="text-sm leading-relaxed text-slate-400">
//                 The fastest way to get household problems fixed. 30 minutes or it's free. Guaranteed.
//               </p>
//             </div>

//             <div>
//               <h4 className="text-white font-bold mb-6">Company</h4>
//               <ul className="space-y-4 text-sm">
//                 <li><a href="#" className="hover:text-white transition-colors">About</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-white font-bold mb-6">Services</h4>
//               <ul className="space-y-4 text-sm">
//                 <li><a href="#" className="hover:text-white transition-colors">Plumbing</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Electrical</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Cleaning</a></li>
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-white font-bold mb-6">Support</h4>
//               <ul className="space-y-4 text-sm">
//                 <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
//             <p>&copy; {new Date().getFullYear()} QuickFix Inc. All rights reserved.</p>
//             <p>Made for modern living.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

// export default LandingPage

// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'

// export const Login = () => {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
//   const [isLoading, setIsLoading] = useState(false)
//   const { login } = useAuth()
//   const navigate = useNavigate()

//   const validate = () => {
//     const newErrors: { email?: string; password?: string } = {}
//     if (!email) {
//       newErrors.email = 'Email is required'
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = 'Email is invalid'
//     }
//     if (!password) {
//       newErrors.password = 'Password is required'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate()) return

//     setIsLoading(true)
//     try {
//       await login(email, password)
//       try {
//         const storedUser = localStorage.getItem('user')
//         if (storedUser) {
//           const userData = JSON.parse(storedUser)
//           if (userData.role === 'PROVIDER') {
//             navigate('/dashboard')
//           } else {
//             navigate('/dashboard')
//           }
//         } else {
//           navigate('/dashboard')
//         }
//       } catch (e) {
//         navigate('/dashboard')
//       }
//     } catch (error) {
//       // Error handled by auth context
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex">
//       {/* Left Side - Branding */}
//       <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
//         {/* Animated gradient background - Violet to Indigo */}
//         <div className="absolute inset-0 bg-gradient-to-br from-[#5B21B6] via-[#6366F1] to-[#7C3AED]">
//           {/* Animated circles */}
//           <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//         </div>

//         {/* Content */}
//         <div className="relative z-10 flex flex-col justify-center items-center w-full px-16 text-white">
//           <div className="max-w-md space-y-6 animate-fade-in">
//             <h1 className="text-5xl font-bold leading-tight">
//               Welcome to<br />QuickFix
//             </h1>
//             <p className="text-xl text-white/90 leading-relaxed">
//               Your trusted platform for connecting with service providers and getting things done efficiently.
//             </p>
//             <div className="flex items-center space-x-4 pt-4">
//               <div className="flex items-center space-x-2">
//                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span>Trusted Providers</span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//                 <span>Quick Booking</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Side - Form */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#F7F7FB] px-8 py-12">
//         <div className="w-full max-w-md">
//           {/* Mobile Logo */}
//           <div className="lg:hidden text-center mb-8">
//             <h1 className="text-3xl font-bold text-[#5B21B6]">Quick Helper</h1>
//           </div>

//           {/* Form Card with glassmorphism effect */}
//           <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all hover:shadow-[0_20px_60px_rgba(91,33,182,0.15)]">
//             <div className="text-center mb-8">
//               <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Welcome Back</h2>
//               <p className="text-[#4B5563]">Sign in to continue to your account</p>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-5">
//               <div className="transform transition-all hover:scale-[1.01]">
//                 <Input
//                   label="Email Address"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   error={errors.email}
//                   placeholder="you@example.com"
//                 />
//               </div>

//               <div className="transform transition-all hover:scale-[1.01]">
//                 <Input
//                   label="Password"
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   error={errors.password}
//                   placeholder="••••••••"
//                 />
//               </div>



//               <Button
//                 type="submit"
//                 className="w-full mt-6 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Sign In
//               </Button>
//             </form>

//             <div className="mt-6 text-center">
//               <p className="text-sm text-[#4B5563]">
//                 Don't have an account?{' '}
//                 <Link
//                   to="/register"
//                   className="text-[#5B21B6] hover:text-[#6366F1] font-semibold transition-colors hover:underline"
//                 >
//                   Create one now
//                 </Link>
//               </p>
//             </div>


//           </div>

//           {/* Footer text */}
//           <p className="text-center text-xs text-[#94A3B8] mt-8">
//             By continuing, you agree to our{' '}
//             <Link to="/terms" className="text-[#5B21B6] hover:underline">Terms of Service</Link>
//             {' '}and{' '}
//             <Link to="/privacy" className="text-[#5B21B6] hover:underline">Privacy Policy</Link>
//           </p>
//         </div>
//       </div>

//       <style>{`
//         @keyframes fade-in {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .animate-fade-in {
//           animation: fade-in 1s ease-out;
//         }
//       `}</style>
//     </div>
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { CalendarIcon } from '../components/icons/CustomIcons'

// export const MultipleBookingDates = () => {
//     const navigate = useNavigate()
//     const [startDate, setStartDate] = useState('')
//     const [endDate, setEndDate] = useState('')

//     const getMinDate = () => {
//         const today = new Date()
//         return today.toISOString().split('T')[0]
//     }

//     const handleNext = () => {
//         if (!startDate || !endDate) return
//         navigate('/select-provider', {
//             state: {
//                 bookingType: 'multiple',
//                 startDate,
//                 endDate
//             }
//         })
//     }

//     return (
//         <div className="flex flex-col gap-8">
//             {/* Back Button */}
//             <div>
//                 <button
//                     onClick={() => navigate('/dashboard')}
//                     className="text-sm font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-2"
//                 >
//                     <span className="material-symbols-outlined text-lg">arrow_back</span>
//                     Back to Dashboard
//                 </button>
//             </div>

//             {/* Header Section */}
//             <div>
//                 <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight mb-2">
//                     Select Dates
//                 </h1>
//                 <p className="text-sm text-text-muted">
//                     Choose the date range for your multiple service booking.
//                 </p>
//             </div>

//             {/* Date Selection Card */}
//             <div className="rounded-3xl bg-card p-8 shadow-sm border border-slate-100">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                     <div className="space-y-2">
//                         <label className="block text-sm font-medium text-text-dark">
//                             Start Date
//                         </label>
//                         <div className="relative">
//                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                 <CalendarIcon size={18} color="#6B7280" />
//                             </div>
//                             <Input
//                                 type="date"
//                                 value={startDate}
//                                 onChange={(e) => setStartDate(e.target.value)}
//                                 min={getMinDate()}
//                                 className="pl-10"
//                             />
//                         </div>
//                     </div>

//                     <div className="space-y-2">
//                         <label className="block text-sm font-medium text-text-dark">
//                             End Date
//                         </label>
//                         <div className="relative">
//                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                                 <CalendarIcon size={18} color="#6B7280" />
//                             </div>
//                             <Input
//                                 type="date"
//                                 value={endDate}
//                                 onChange={(e) => setEndDate(e.target.value)}
//                                 min={startDate || getMinDate()}
//                                 className="pl-10"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Info Box */}
//                 <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8">
//                     <div className="flex gap-4">
//                         <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
//                             <span className="material-symbols-outlined text-primary text-xl">info</span>
//                         </div>
//                         <div>
//                             <h4 className="font-bold text-text-dark mb-1">How it works</h4>
//                             <p className="text-sm text-text-muted leading-relaxed">
//                                 You are creating a package booking. You will be able to select <strong className="text-text-dark">multiple providers</strong> in the next step.
//                                 A booking will be created for each day in the selected range for every provider you choose.
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Find Providers Button */}
//                 <Button
//                     className="w-full py-6 text-base font-medium rounded-xl"
//                     onClick={handleNext}
//                     disabled={!startDate || !endDate}
//                 >
//                     Find Providers
//                 </Button>
//             </div>
//         </div>
//     )
// }

// import { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Avatar } from '../components/ui/Avatar'
// import { useNavigate } from 'react-router-dom'
// import { providerService } from '../services/providerService'
// import { ProfileSkeleton } from '../components/ui/Loader'
// import {
//   PhoneIcon,
//   LogOutIcon,
//   MapPinIcon,
//   WalletIcon,
//   TagIcon,
//   HeadphonesIcon,
//   ArrowRightIcon,
//   LightningIcon,
//   CleaningIcon,
//   PlumbingIcon,
//   UserIcon,
// } from '../components/icons/CustomIcons'
// import type { ProviderProfile } from '../types'
// import { PortfolioGallery } from '../components/PortfolioGallery'
// import toast from 'react-hot-toast'

// const SERVICE_MAPPING: Record<string, { label: string; icon: any; color: string }> = {
//   CLEANER: { label: 'Cleaning Specialist', icon: CleaningIcon, color: '#5B21B6' },
//   PLUMBER: { label: 'Plumbing Expert', icon: PlumbingIcon, color: '#F97316' },
//   ELECTRICIAN: { label: 'Electrical Expert', icon: LightningIcon, color: '#F59E0B' },
//   LAUNDRY: { label: 'Laundry Service', icon: CleaningIcon, color: '#5B21B6' },
//   OTHER: { label: 'Service Provider', icon: UserIcon, color: '#6B7280' },
// }

// const ProviderProfileView = () => {
//   const { user } = useAuth()
//   const [profile, setProfile] = useState<ProviderProfile | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [services, setServices] = useState<
//     { id: number; name: string; description: string; price: number; unit: string; active: boolean; color: string }[]
//   >([])
//   const [showAddService, setShowAddService] = useState(false)
//   const [newService, setNewService] = useState({
//     name: '',
//     description: '',
//     price: 0,
//     unit: 'hr',
//     active: true,
//   })
//   const [editingServiceId, setEditingServiceId] = useState<number | null>(null)
//   const [editingService, setEditingService] = useState({
//     name: '',
//     description: '',
//     price: 0,
//     unit: 'hr',
//     active: true,
//   })

//   // Enhanced profile states
//   const [profileBio, setProfileBio] = useState('')
//   const [profileTagline, setProfileTagline] = useState('')
//   const [displayName, setDisplayName] = useState('')
//   const [yearsExperience, setYearsExperience] = useState(0)
//   const [portfolioImages, setPortfolioImages] = useState<{ id: number, url: string }[]>([])
//   const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('')

//   const [isEditingProfile, setIsEditingProfile] = useState(false)

//   // Handle portfolio image upload
//   const handlePortfolioImageUpload = async (files: FileList) => {
//     if (!profile) return

//     try {
//       const uploadedImages: { id: number; url: string }[] = []
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i]
//         const updatedProfile = await providerService.uploadPortfolioImage(profile.id, file)
//         // Get the newly added image URL from the updated profile
//         const newImages = updatedProfile.portfolioImages || []
//         const newImage = newImages[newImages.length - 1] // Last added image
//         if (newImage) {
//           uploadedImages.push({
//             id: Date.now() + i, // Simple ID generation
//             url: newImage
//           })
//         }
//       }
//       setPortfolioImages(prev => [...prev, ...uploadedImages])
//     } catch (error) {
//       console.error('Failed to upload portfolio images', error)
//     }
//   }

//   // Handle profile photo upload
//   const handleProfilePhotoUpload = async (file: File) => {
//     if (!profile) return

//     try {
//       const updatedProfile = await providerService.uploadPortfolioImage(profile.id, file)

//       // Use the uploaded image as profile photo (get the last uploaded image)
//       if (updatedProfile.portfolioImages && updatedProfile.portfolioImages.length > 0) {
//         const uploadedUrl = updatedProfile.portfolioImages[updatedProfile.portfolioImages.length - 1]
//         console.log('Uploaded photo URL:', uploadedUrl)
//         console.log('Full URL:', uploadedUrl)
//         setProfilePhotoUrl(uploadedUrl)
//         setProfile(updatedProfile) // Update profile state
//         toast.success('Profile photo uploaded successfully!')
//       }
//     } catch (error) {
//       console.error('Failed to upload profile photo', error)
//       toast.error('Failed to upload profile photo')
//     }
//   }

//   // Handle portfolio image deletion
//   const handlePortfolioImageDelete = async (id: number) => {
//     if (!profile) return

//     try {
//       const imageToDelete = portfolioImages.find(img => img.id === id)
//       if (imageToDelete) {
//         // Strip the localhost prefix before sending to backend
//         const relativeUrl = imageToDelete.url
//         const updatedProfile = await providerService.removePortfolioImage(profile.id, relativeUrl)
//         setPortfolioImages(prev => prev.filter(img => img.id !== id))
//       }
//     } catch (error) {
//       console.error('Failed to delete portfolio image', error)
//     }
//   }

//   // Handle saving the profile
//   const handleSaveProfile = async () => {
//     if (!profile) return

//     // Validate required fields
//     if (!profileBio || profileBio.trim() === '') {
//       console.error('Description/bio is required')
//       toast.error('Please provide a description/bio for your profile')
//       return
//     }

//     try {
//       const updateData: any = {
//         serviceType: profile.serviceType, // Keep existing service type
//         description: profileBio.trim(),
//         experienceYears: yearsExperience || 0,
//         portfolioImages: portfolioImages.map(img => img.url), // Send image URLs to backend
//         displayName: displayName.trim() || null,
//         profilePhotoUrl: profilePhotoUrl || null,
//         tagline: profileTagline.trim() || null
//       }

//       // Only include optional fields if they have valid values
//       if (profile.basePrice && profile.basePrice > 0) {
//         updateData.basePrice = profile.basePrice
//       }
//       if (profile.locationLat !== null && profile.locationLat !== undefined) {
//         updateData.locationLat = profile.locationLat
//       }
//       if (profile.locationLng !== null && profile.locationLng !== undefined) {
//         updateData.locationLng = profile.locationLng
//       }

//       const updatedProfile = await providerService.updateProfile(profile.id, updateData)

//       // Update the profile state with the response
//       setProfile(updatedProfile)

//       // Update local state with saved values from backend
//       setDisplayName(updatedProfile.displayName || user?.name || '')
//       setProfileBio(updatedProfile.description || '')
//       setProfileTagline(updatedProfile.tagline || '')
//       setYearsExperience(updatedProfile.experienceYears || 0)
//       setProfilePhotoUrl(updatedProfile.profilePhotoUrl || '')

//       // Update portfolio images
//       if (updatedProfile.portfolioImages) {
//         const imagesWithIds = updatedProfile.portfolioImages.map((url, index) => ({
//           id: index + 1,
//           url: url
//         }))
//         setPortfolioImages(imagesWithIds)
//       }

//       setIsEditingProfile(false)

//       // Show success message
//       console.log('Profile saved successfully')
//       toast.success('Profile saved successfully!')
//     } catch (error: any) {
//       console.error('Failed to save profile', error)
//       console.error('Error response:', error.response?.data)
//       console.error('Error status:', error.response?.status)
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
//       toast.error(`Failed to save profile: ${errorMessage}`)
//     }
//   }

//   useEffect(() => {
//     fetchData(true)
//   }, [user?.id])

//   const fetchData = async (showLoader = false) => {
//     if (!user) return
//     try {
//       if (showLoader) setIsLoading(true)
//       const providersData = await providerService.getAllProviders()
//       const provider = providersData.find((p) => p.userId === user.id) || null
//       setProfile(provider)

//       // Pre-populate profile fields from provider data
//       if (provider) {
//         setDisplayName(provider.displayName || user.name)
//         setProfileBio(provider.description || '')
//         setProfileTagline(provider.tagline || '')
//         setYearsExperience(provider.experienceYears || 0)
//         setProfilePhotoUrl(provider.profilePhotoUrl || '')

//         // Initialize portfolio images
//         if (provider.portfolioImages) {
//           const imagesWithIds = provider.portfolioImages.map((url, index) => ({
//             id: index + 1,
//             url: url
//           }))
//           setPortfolioImages(imagesWithIds)
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load provider profile', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Load services when profile is available
//   useEffect(() => {
//     const loadServices = async () => {
//       if (!profile) return
//       try {
//         const list = await providerService.listServices(profile.id)
//         const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
//         setServices(
//           list.map((s) => ({
//             id: s.id,
//             name: s.name,
//             description: s.description || '',
//             price: s.price,
//             unit: s.unit,
//             active: s.active,
//             color,
//           })),
//         )
//       } catch (error) {
//         console.error('Failed to load services', error)
//       }
//     }
//     loadServices()
//   }, [profile])


//   const handleAddService = () => {
//     if (!newService.name.trim()) return
//     if (!profile) return
//     providerService
//       .addService(profile.id, {
//         name: newService.name.trim(),
//         description: newService.description.trim() || 'No description provided.',
//         price: newService.price,
//         unit: newService.unit,
//         active: newService.active,
//       })
//       .then((created) => {
//         const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
//         setServices((prev) => [
//           ...prev,
//           {
//             id: created.id,
//             name: created.name,
//             description: created.description || '',
//             price: created.price,
//             unit: created.unit,
//             active: created.active,
//             color,
//           },
//         ])
//         setNewService({ name: '', description: '', price: 0, unit: 'hr', active: true })
//         setShowAddService(false)
//       })
//       .catch((err) => {
//         console.error('Failed to add service', err)
//       })
//   }

//   const startEditService = (svcId: number) => {
//     const target = services.find((s) => s.id === svcId)
//     if (!target) return
//     setEditingServiceId(svcId)
//     setEditingService({
//       name: target.name,
//       description: target.description || '',
//       price: target.price,
//       unit: target.unit,
//       active: target.active,
//     })
//   }

//   const toggleServiceActive = (svcId: number, next: boolean) => {
//     const target = services.find((s) => s.id === svcId)
//     if (!profile || !target) return
//     providerService
//       .updateService(profile.id, svcId, {
//         name: target.name,
//         description: target.description || '',
//         price: target.price,
//         unit: target.unit,
//         active: next,
//       })
//       .then((updated) => {
//         const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
//         setServices((prev) =>
//           prev.map((s) =>
//             s.id === updated.id
//               ? {
//                 id: updated.id,
//                 name: updated.name,
//                 description: updated.description || '',
//                 price: updated.price,
//                 unit: updated.unit,
//                 active: updated.active,
//                 color,
//               }
//               : s,
//           ),
//         )
//       })
//       .catch((err) => {
//         console.error('Failed to update service status', err)
//       })
//   }

//   const handleUpdateService = () => {
//     if (!profile || editingServiceId == null) return
//     providerService
//       .updateService(profile.id, editingServiceId, {
//         name: editingService.name.trim(),
//         description: editingService.description?.trim() || '',
//         price: editingService.price,
//         unit: editingService.unit,
//         active: editingService.active,
//       })
//       .then((updated) => {
//         const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
//         setServices((prev) =>
//           prev.map((s) =>
//             s.id === updated.id
//               ? {
//                 id: updated.id,
//                 name: updated.name,
//                 description: updated.description || '',
//                 price: updated.price,
//                 unit: updated.unit,
//                 active: updated.active,
//                 color,
//               }
//               : s,
//           ),
//         )
//         setEditingServiceId(null)
//       })
//       .catch((err) => {
//         console.error('Failed to update service', err)
//       })
//   }

//   if (!user) return null

//   if (isLoading) {
//     return <ProfileSkeleton />
//   }

//   return (
//     <div className="max-w-7xl mx-auto pb-16">
//       {/* Full width layout */}
//       <div className="space-y-5">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-[26px] font-semibold text-text-primary">Profile & Availability</h1>
//             <p className="text-sm text-text-secondary">
//               Manage your public info, service menu, and working hours.
//             </p>
//           </div>
//         </div>

//         {/* Professional Profile Section */}
//         <Card className="shadow-sm">
//           <CardContent className="p-6 space-y-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-semibold text-text-primary">Professional Profile</h2>
//                 <p className="text-sm text-text-secondary mt-1">Showcase your expertise to customers</p>
//               </div>
//               {!isEditingProfile ? (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setIsEditingProfile(true)}
//                 >
//                   <span className="material-symbols-outlined text-sm mr-2">edit</span>
//                   Edit
//                 </Button>
//               ) : (
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setIsEditingProfile(false)
//                       // Reset to saved values
//                       if (profile) {
//                         setDisplayName((profile as any).displayName || user.name)
//                         setProfileBio((profile as any).bio || profile.description || '')
//                         setProfileTagline((profile as any).tagline || '')
//                         setYearsExperience((profile as any).yearsExperience || 0)
//                         setProfilePhotoUrl((profile as any).profilePhotoUrl || '')

//                         // Reset portfolio images
//                         if (profile.portfolioImages) {
//                           const imagesWithIds = profile.portfolioImages.map((url, index) => ({
//                             id: index + 1,
//                             url: `http://localhost:3000${url}`
//                           }))
//                           setPortfolioImages(imagesWithIds)
//                         }
//                       }
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     size="sm"
//                     onClick={handleSaveProfile}
//                   >
//                     <span className="material-symbols-outlined text-sm mr-2">check</span>
//                     Save
//                   </Button>
//                 </div>
//               )}
//             </div>

//             <div className="space-y-4">
//               {/* Profile Photo Upload */}
//               <div>
//                 <label className="block text-sm font-medium text-text-primary mb-2">
//                   Profile Photo
//                 </label>
//                 {isEditingProfile ? (
//                   <div className="flex items-center gap-4">
//                     <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
//                       {profilePhotoUrl ? (
//                         <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
//                       ) : (
//                         <UserIcon size={40} color="#9CA3AF" />
//                       )}
//                     </div>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                         if (e.target.files && e.target.files[0]) {
//                           handleProfilePhotoUpload(e.target.files[0])
//                         }
//                       }}
//                       className="block text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
//                     />
//                   </div>
//                 ) : (
//                   <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
//                     {profilePhotoUrl ? (
//                       <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
//                     ) : (
//                       <UserIcon size={40} color="#9CA3AF" />
//                     )}
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-text-primary mb-2">
//                   Display Name / Business Name
//                 </label>
//                 {isEditingProfile ? (
//                   <input
//                     type="text"
//                     value={displayName}
//                     onChange={(e) => setDisplayName(e.target.value)}
//                     placeholder="e.g., John's Professional Cleaning"
//                     className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
//                   />
//                 ) : (
//                   <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
//                     {displayName || 'Not set'}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-text-primary mb-2">
//                   Professional Tagline
//                 </label>
//                 {isEditingProfile ? (
//                   <input
//                     type="text"
//                     value={profileTagline}
//                     onChange={(e) => setProfileTagline(e.target.value)}
//                     placeholder="e.g., Your Trusted Cleaning Expert"
//                     className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
//                     maxLength={100}
//                   />
//                 ) : (
//                   <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
//                     {profileTagline || 'Not set'}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-text-primary mb-2">
//                   About / Bio
//                 </label>
//                 {isEditingProfile ? (
//                   <>
//                     <textarea
//                       value={profileBio}
//                       onChange={(e) => setProfileBio(e.target.value)}
//                       placeholder="Tell customers about your experience, specializations, and what makes you stand out..."
//                       className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card resize-none"
//                       rows={4}
//                       maxLength={500}
//                     />
//                     <p className="text-sm text-text-muted mt-1">{profileBio.length}/500 characters</p>
//                   </>
//                 ) : (
//                   <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl min-h-[100px] whitespace-pre-wrap">
//                     {profileBio || 'Not set'}
//                   </p>
//                 )}
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-text-primary mb-2">
//                     Years of Experience
//                   </label>
//                   {isEditingProfile ? (
//                     <select
//                       value={yearsExperience}
//                       onChange={(e) => setYearsExperience(Number(e.target.value))}
//                       className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
//                     >
//                       <option value={0}>Select experience</option>
//                       {[...Array(20)].map((_, i) => (
//                         <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'year' : 'years'}</option>
//                       ))}
//                     </select>
//                   ) : (
//                     <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
//                       {yearsExperience > 0 ? `${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'}` : 'Not set'}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="pt-4 border-t border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-sm font-medium text-text-primary">Payout Settings</h3>
//                   <p className="text-xs text-text-secondary">
//                     {profile?.stripeAccountId
//                       ? 'Your account is connected to Stripe for payouts.'
//                       : 'Connect with Stripe to receive payments directly to your bank account.'}
//                   </p>
//                 </div>
//                 {profile?.stripeAccountId ? (
//                   <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100">
//                     <span className="material-symbols-outlined text-sm">check_circle</span>
//                     <span className="text-sm font-medium">Payouts Enabled</span>
//                   </div>
//                 ) : (
//                   <Button
//                     size="sm"
//                     className="bg-[#635BFF] hover:bg-[#5851df] text-white" // Stripe blurple color
//                     onClick={async () => {
//                       if (!profile || !user) return;
//                       try {
//                         // Use current URL as base for refresh/return
//                         const returnUrl = window.location.href;
//                         const refreshUrl = window.location.href;

//                         // Get token from auth context or local storage? 
//                         // Hook useAuth usually provides token, but if not we can get it from localStorage or api 
//                         // Assuming api handles token injection or we get it from local storage
//                         const token = localStorage.getItem('token') || '';

//                         const { url } = await import('../api').then(m => m.paymentApi.onboardProvider(profile.id, refreshUrl, returnUrl, token));

//                         if (url) {
//                           window.location.href = url;
//                         }
//                       } catch (error) {
//                         console.error('Failed to start onboarding', error);
//                         toast.error('Failed to start setup. Please try again.');
//                       }
//                     }}
//                   >
//                     Setup Payouts
//                     <span className="material-symbols-outlined text-sm ml-2">open_in_new</span>
//                   </Button>
//                 )}
//               </div>
//             </div>

//           </CardContent>
//         </Card>

//         {/* Portfolio Gallery Section */}
//         <Card className="shadow-sm">
//           <CardContent className="p-6">
//             <PortfolioGallery
//               images={portfolioImages.map(img => ({ ...img, category: 'work' as const }))}
//               onUpload={handlePortfolioImageUpload}
//               onDelete={handlePortfolioImageDelete}
//               editable
//             />
//           </CardContent>
//         </Card>

//         {/* Service menu only */}
//         <Card className="border border-border">
//           <CardContent className="p-5 space-y-5">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <p className="text-sm text-text-secondary">Service Menu</p>
//                 <p className="text-base font-semibold text-text-primary">
//                   Manage your offerings and pricing.
//                 </p>
//               </div>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="border-border text-text-primary"
//                 onClick={() => setShowAddService(true)}
//               >
//                 Add Service
//               </Button>
//             </div>

//             {showAddService && (
//               <div className="rounded-xl border border-border bg-[#F9FAFB] p-4 space-y-3">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <div className="space-y-1">
//                     <p className="text-xs text-text-secondary">Service Name</p>
//                     <input
//                       className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                       value={newService.name}
//                       onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
//                       placeholder="e.g. Deep Cleaning"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-xs text-text-secondary">Price</p>
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="number"
//                         className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                         value={newService.price}
//                         onChange={(e) => setNewService((s) => ({ ...s, price: Number(e.target.value) }))}
//                         placeholder="50"
//                         min={0}
//                       />
//                       <span className="text-sm text-text-secondary">/ {newService.unit}</span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="space-y-1">
//                   <p className="text-xs text-text-secondary">Description</p>
//                   <textarea
//                     className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                     rows={2}
//                     value={newService.description}
//                     onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
//                     placeholder="What is included?"
//                   />
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
//                     <input
//                       type="checkbox"
//                       checked={newService.active}
//                       onChange={(e) => setNewService((s) => ({ ...s, active: e.target.checked }))}
//                     />
//                     Active
//                   </label>
//                   <div className="ml-auto flex gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="border-border text-text-primary"
//                       onClick={() => {
//                         setShowAddService(false)
//                         setNewService({ name: '', description: '', price: 0, unit: 'hr', active: true })
//                       }}
//                     >
//                       Cancel
//                     </Button>
//                     <Button size="sm" className="bg-primary text-white" onClick={handleAddService}>
//                       Save Service
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="space-y-3">
//               {services.map((svc) => (
//                 <div
//                   key={svc.id}
//                   className="rounded-2xl border border-border bg-white shadow-soft p-4 space-y-3 flex flex-col md:flex-row md:items-center md:space-y-0 md:justify-between"
//                 >
//                   {editingServiceId === svc.id ? (
//                     <div className="w-full space-y-3">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <div className="space-y-1">
//                           <p className="text-xs text-text-secondary">Service Name</p>
//                           <input
//                             className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                             value={editingService.name}
//                             onChange={(e) => setEditingService((s) => ({ ...s, name: e.target.value }))}
//                           />
//                         </div>
//                         <div className="space-y-1">
//                           <p className="text-xs text-text-secondary">Price</p>
//                           <div className="flex items-center gap-2">
//                             <input
//                               type="number"
//                               className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                               value={editingService.price}
//                               onChange={(e) => setEditingService((s) => ({ ...s, price: Number(e.target.value) }))}
//                               min={0}
//                             />
//                             <span className="text-sm text-text-secondary">/ {editingService.unit}</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="space-y-1">
//                         <p className="text-xs text-text-secondary">Description</p>
//                         <textarea
//                           className="w-full rounded-lg border border-border px-3 py-2 text-sm"
//                           rows={2}
//                           value={editingService.description}
//                           onChange={(e) => setEditingService((s) => ({ ...s, description: e.target.value }))}
//                         />
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
//                           <input
//                             type="checkbox"
//                             checked={editingService.active}
//                             onChange={(e) => setEditingService((s) => ({ ...s, active: e.target.checked }))}
//                           />
//                           Active
//                         </label>
//                         <div className="ml-auto flex gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             className="border-border text-text-primary"
//                             onClick={() => setEditingServiceId(null)}
//                           >
//                             Cancel
//                           </Button>
//                           <Button size="sm" className="bg-primary text-white" onClick={handleUpdateService}>
//                             Save
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <>
//                       <div className="flex items-start gap-3">
//                         <div
//                           className="h-10 w-10 rounded-full flex items-center justify-center"
//                           style={{ backgroundColor: `${svc.color}15` }}
//                         >
//                           <LightningIcon size={20} color={svc.color} />
//                         </div>
//                         <div>
//                           <p className="font-semibold text-text-primary flex items-center gap-2">
//                             {svc.name}
//                             <span
//                               className={`text-[11px] font-semibold px-2 py-1 rounded-full ${svc.active ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#F3F4F6] text-[#6B7280]'
//                                 }`}
//                             >
//                               {svc.active ? 'ACTIVE' : 'INACTIVE'}
//                             </span>
//                           </p>
//                           <p className="text-xs text-text-secondary">{svc.description}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <div className="text-sm font-semibold text-text-primary">
//                           ₹{svc.price.toLocaleString()} <span className="text-xs text-text-secondary">/ {svc.unit}</span>
//                         </div>
//                         <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
//                           <input
//                             type="checkbox"
//                             checked={svc.active}
//                             onChange={(e) => toggleServiceActive(svc.id, e.target.checked)}
//                           />
//                           {svc.active ? 'On' : 'Off'}
//                         </label>
//                         <Button variant="outline" size="sm" className="border-border text-text-primary" onClick={() => startEditService(svc.id)}>
//                           Edit
//                         </Button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>


//       </div>
//     </div>
//   )
// }

// const UserProfileView = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
//   const [isEditing, setIsEditing] = useState(false)
//   const [editForm, setEditForm] = useState({
//     name: user.name || '',
//     phone: user.phone || '',
//     city: user.city || ''
//   })
//   const navigate = useNavigate()
//   const { fetchUser } = useAuth() // Assuming fetchUser refreshes user data in context

//   const handleSave = async () => {
//     try {
//       await import('../services/userService').then(m => m.userService.updateUser(user.id, editForm))
//       setIsEditing(false)
//       toast.success('Profile updated successfully')
//       // Refresh user context if possible, or just wait for reload. 
//       // Ideally AuthContext should expose a reload or we manually update it.
//       // For now, reload page to reflect simple changes or assume Context updates eventually.
//       window.location.reload()
//     } catch (error) {
//       console.error('Failed to update profile', error)
//       toast.error('Failed to update profile')
//     }
//   }

//   const quickLinks = [
//     {
//       icon: WalletIcon, // Reusing WalletIcon as "Bookings" indicator for now if Calendar isn't available
//       label: 'My Bookings',
//       description: 'View past and upcoming jobs',
//       path: '/bookings',
//       color: '#6366F1',
//       action: () => navigate('/bookings')
//     },
//     {
//       icon: HeadphonesIcon,
//       label: 'Help & Support',
//       description: 'Contact our support team',
//       path: '#',
//       color: '#10B981',
//       action: () => window.location.href = 'mailto:support@quickfix.com'
//     }
//   ]

//   return (
//     <div className="max-w-4xl mx-auto pb-24 space-y-6">
//       {/* Hero Section / Profile Header */}
//       <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-large p-8 md:p-12">
//         {/* Decorative background circles */}
//         <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
//         <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-white opacity-10 blur-2xl"></div>

//         <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
//           <div className="relative">
//             <div className="h-28 w-28 md:h-32 md:w-32 rounded-full p-1 bg-white/20 backdrop-blur-sm shadow-xl flex items-center justify-center">
//               <Avatar name={user.name} className="h-full w-full border-4 border-white text-3xl font-bold" />
//             </div>
//           </div>

//           <div className="flex-1 space-y-4 w-full">
//             {isEditing ? (
//               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-white/80 text-sm pl-1">Full Name</label>
//                     <input
//                       value={editForm.name}
//                       onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
//                       className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-white/80 text-sm pl-1">Phone Number</label>
//                     <input
//                       value={editForm.phone}
//                       onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
//                       className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-white/80 text-sm pl-1">City</label>
//                     <input
//                       value={editForm.city}
//                       onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
//                       className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex justify-end gap-3 pt-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
//                     onClick={() => setIsEditing(false)}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     size="sm"
//                     className="bg-white text-primary hover:bg-white/90"
//                     onClick={handleSave}
//                   >
//                     Save Changes
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center md:text-left space-y-2">
//                 <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
//                   {user.name}
//                 </h1>
//                 <div className="flex flex-col md:flex-row items-center gap-4 text-white/90 font-medium">
//                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm border border-white/10">
//                     <span className="material-symbols-outlined text-[18px]">mail</span>
//                     {user.email}
//                   </div>
//                   {(user.phone || user.city) && (
//                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm border border-white/10">
//                       <span className="material-symbols-outlined text-[18px]">location_on</span>
//                       {[user.phone, user.city].filter(Boolean).join(' • ')}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {!isEditing && (
//             <div className="mt-4 md:mt-0">
//               <Button
//                 variant="secondary"
//                 className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all font-semibold shadow-lg"
//                 onClick={() => setIsEditing(true)}
//               >
//                 <span className="material-symbols-outlined text-xl mr-2">edit</span>
//                 Edit Profile
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Quick Links Section */}
//       <div>
//         <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2 px-1">
//           <span className="w-1 h-6 bg-primary rounded-full"></span>
//           Quick Actions
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {quickLinks.map((item, index) => {
//             const Icon = item.icon
//             return (
//               <Card
//                 key={index}
//                 className="group cursor-pointer border-transparent hover:border-primary/10 transition-all duration-300 hover:shadow-medium hover:-translate-y-1 overflow-hidden relative"
//                 onClick={item.action}
//               >
//                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   <ArrowRightIcon size={20} color={item.color} />
//                 </div>

//                 <CardContent className="p-6">
//                   <div className="flex items-start gap-5">
//                     <div
//                       className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
//                       style={{ backgroundColor: `${item.color}15` }}
//                     >
//                       <Icon size={24} color={item.color} />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
//                         {item.label}
//                       </h3>
//                       <p className="text-sm text-text-secondary mt-1 group-hover:text-text-primary/80 transition-colors">
//                         {item.description}
//                       </p>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       </div>

//       {/* Logout Section */}
//       <div className="flex justify-center pt-8">
//         <Button
//           variant="outline"
//           className="text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 w-full md:w-auto px-8 py-4 rounded-xl hover:shadow-md transition-all"
//           onClick={onLogout}
//         >
//           <LogOutIcon size={20} color="currentColor" className="mr-2" />
//           <span className="font-semibold text-lg">Sign Out</span>
//         </Button>
//       </div>
//     </div>
//   )
// }

// export const Profile = () => {
//   const { user, logout } = useAuth()
//   const navigate = useNavigate()

//   const handleLogout = () => {
//     logout()
//     navigate('/login')
//   }

//   if (!user) {
//     return null
//   }

//   if (user.role === 'PROVIDER') {
//     return <ProviderProfileView />
//   }

//   return <UserProfileView user={user} onLogout={handleLogout} />
// }

// import { useEffect, useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// // import { useAuth } from '../contexts/AuthContext' - removed
// import { useNotifications } from '../contexts/NotificationContext'
// import { Button } from '../components/ui/Button'
// import { bookingService } from '../services/bookingService'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import { ProviderDashboardSkeleton } from '../components/ui/Loader'
// import type { Booking, ProviderProfile, User } from '../types'
// import {
//   ClockIcon,
//   CleaningIcon,
//   PlumbingIcon,
//   LightningIcon,
//   CalendarIcon,
// } from '../components/icons/CustomIcons'
// import { format, parseISO, isToday, min, max } from 'date-fns'

// const SERVICE_MAPPING: Record<string, { label: string; icon: any; color: string }> = {
//   CLEANER: { label: 'Cleaning', icon: CleaningIcon, color: '#3B82F6' },
//   PLUMBER: { label: 'Plumbing', icon: PlumbingIcon, color: '#F97316' },
//   ELECTRICIAN: { label: 'Electrical', icon: LightningIcon, color: '#FCD34D' },
//   LAUNDRY: { label: 'Laundry', icon: CleaningIcon, color: '#3B82F6' },
//   OTHER: { label: 'Other', icon: PlumbingIcon, color: '#F97316' },
// }

// interface ProviderDashboardProps {
//   user: User
// }

// type JobTab = 'nearby' | 'recent'

// // Helper structure for grouped bookings
// interface BookingGroup {
//   id: string // composite id
//   isGroup: true
//   bookings: Booking[]
//   user: User
//   serviceType: string
//   note?: string
//   totalPrice?: number
//   earliestDate: Date | null
//   latestDate: Date | null
//   createdAt: string
// }

// // Helper function to extract price from booking note
// const extractPriceFromNote = (note?: string): number | null => {
//   if (!note) return null
//   // Match patterns like "₹500" or "- ₹500/" in the note
//   const match = note.match(/₹(\d+)/)
//   return match ? parseInt(match[1], 10) : null
// }

// const parseCreatedAt = (createdAt?: string): Date | null => {
//   if (!createdAt) return null
//   const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(createdAt)
//   const normalized = hasTimezone ? createdAt : `${createdAt}Z`
//   const parsed = new Date(normalized)
//   return Number.isNaN(parsed.getTime()) ? null : parsed
// }

// export const ProviderDashboard = ({ user }: ProviderDashboardProps) => {
//   const navigate = useNavigate()
//   /* Timer State */
//   const [currentDate, setCurrentDate] = useState(new Date())

//   useEffect(() => {
//     const timer = setInterval(() => setCurrentDate(new Date()), 1000)
//     return () => clearInterval(timer)
//   }, [])

//   const getRemainingTime = (createdAt: string) => {
//     const created = parseCreatedAt(createdAt)
//     if (!created) return null
//     const expiresAt = new Date(created.getTime() + 5 * 60 * 1000) // 5 minutes
//     const diff = expiresAt.getTime() - currentDate.getTime()

//     if (diff <= 0) return null

//     const minutes = Math.floor(diff / 60000)
//     const seconds = Math.floor((diff % 60000) / 1000)
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`
//   }
//   const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
//   const [bookings, setBookings] = useState<Booking[]>([])
//   const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [activeJobTab, setActiveJobTab] = useState<JobTab>('nearby')
//   /* Persist dismissed alerts */
//   const [dismissedAlertIds, setDismissedAlertIds] = useState<number[]>(() => {
//     try {
//       const stored = localStorage.getItem('dismissedAlertIds')
//       return stored ? JSON.parse(stored) : []
//     } catch {
//       return []
//     }
//   })

//   const [selectedGroup, setSelectedGroup] = useState<BookingGroup | null>(null)



//   useEffect(() => {
//     fetchData()

//     // Poll for updates every 30 seconds to keep list fresh (e.g. handle auto-expired)
//     const interval = setInterval(() => {
//       fetchData()
//     }, 30000)

//     return () => clearInterval(interval)
//   }, [user.id])

//   /* Auto-refresh Logic */
//   const { notifications } = useNotifications()
//   const [lastProcessedId, setLastProcessedId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       if (latest.id !== lastProcessedId) {
//         // Check for relevant notification types that should trigger a refresh
//         const JOB_REFRESH_TYPES = [
//           'NEW_BOOKING_REQUEST',
//           'BOOKING_CANCELLED',
//           'JOB_ACCEPTED',
//           'JOB_COMPLETED',
//           'EARNINGS_CREDITED',
//           // Include user types that might be relevant if roles overlap or just in case
//           'BOOKING_ACCEPTED',
//           'BOOKING_REJECTED'
//         ];

//         // Also check legacy string matching as fallback
//         const isJobRelated = JOB_REFRESH_TYPES.includes(latest.type) ||
//           latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job');

//         if (isJobRelated) {
//           console.log(`Real-time update received (Type: ${latest.type}), refreshing dashboard...`, latest.id)
//           fetchData() // Refresh without full loader to be less intrusive
//           setLastProcessedId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   const fetchData = async () => {
//     try {
//       setLoading(true)
//       const [bookingsData, providerData] = await Promise.all([
//         bookingService.getBookingsByProvider(user.id),
//         providerService.getProviderByUserId(user.id),
//       ])

//       setBookings(bookingsData)
//       setProviderProfile(providerData)

//       // Redirect if profile is missing or not approved
//       if (!providerData || providerData.profileStatus !== 'APPROVED') {
//         navigate('/provider-setup')
//         return
//       }
//     } catch (error) {
//       console.error('Failed to fetch data:', error)
//       toast.error('Failed to load dashboard data')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleAccept = async (bookingId: number) => {
//     optimisticUpdateStatus(bookingId, 'ACCEPTED')
//     try {
//       await bookingService.acceptBooking(bookingId)
//       toast.success('Booking accepted!')
//       fetchData()
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to accept booking')
//       fetchData()
//     }
//   }




//   // Batch Accept
//   const handleBatchAccept = async (bookingIds: number[]) => {
//     // Optimistic update all
//     bookingIds.forEach(id => optimisticUpdateStatus(id, 'ACCEPTED'))
//     try {
//       // Process sequentially to ensure all are accepted
//       // In a real optimized backend, we'd have a batch-accept endpoint
//       await Promise.all(bookingIds.map(id => bookingService.acceptBooking(id)))
//       toast.success(`Accepted package of ${bookingIds.length} bookings!`)
//       fetchData()
//       fetchData()
//     } catch (error: any) {
//       toast.error('Failed to accept some bookings in the package')
//       fetchData()
//     }
//   }

//   const handleReject = async (bookingId: number) => {
//     optimisticUpdateStatus(bookingId, 'REJECTED')
//     try {
//       await bookingService.rejectBooking(bookingId)
//       toast.success('Booking rejected')
//       fetchData()
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to reject booking')
//       fetchData()
//     }
//   }


//   const handleBatchReject = async (bookingIds: number[]) => {
//     bookingIds.forEach(id => optimisticUpdateStatus(id, 'REJECTED'))
//     try {
//       await Promise.all(bookingIds.map(id => bookingService.rejectBooking(id)))
//       toast.success('Package declined')
//       fetchData()
//       fetchData()
//     } catch (error: any) {
//       toast.error('Failed to decline some bookings')
//       fetchData()
//     }
//   }


//   const handleGroupClick = (group: BookingGroup) => {
//     setSelectedGroup(group)
//   }

//   const handleJobClick = (booking: Booking) => {
//     navigate(`/provider/job/${booking.id}/track`)
//   }




//   const handleComplete = async (bookingId: number) => {
//     optimisticUpdateStatus(bookingId, 'COMPLETED')
//     try {
//       await bookingService.completeBooking(bookingId)
//       toast.success('Booking completed!')
//       fetchData()
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to complete booking')
//       fetchData()
//     }
//   }

//   const handleAvailabilityToggle = async (isAvailable: boolean) => {
//     if (!providerProfile) {
//       toast.error('Please create a provider profile first')
//       navigate('/provider-setup')
//       return
//     }

//     // Check if provider is approved
//     if (!providerProfile.isApproved) {
//       toast.error('Your provider profile is pending approval')
//       return
//     }

//     try {
//       setIsUpdatingAvailability(true)
//       const updated = await providerService.updateAvailability(providerProfile.id, {
//         isAvailable,
//       })
//       setProviderProfile(updated)
//       toast.success(isAvailable ? 'You are now online' : 'You are now offline')
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to update availability')
//     } finally {
//       setIsUpdatingAvailability(false)
//     }
//   }

//   const optimisticUpdateStatus = (bookingId: number, status: Booking['status']) => {
//     setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)))
//   }

//   // Calculate stats
//   // Note: For stats, we count individual bookings
//   const newRequests = bookings.filter(b => b.status === 'REQUESTED').length
//   const acceptedJobs = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length
//   const todayCompleted = bookings.filter(b => {
//     if (b.status !== 'COMPLETED' || !b.completedAt) return false
//     return isToday(parseISO(b.completedAt))
//   }).length

//   // Get available jobs (REQUESTED status)
//   const availableJobs = bookings.filter(b => b.status === 'REQUESTED')

//   const toRadians = (degree: number) => (degree * Math.PI) / 180

//   const calculateDistanceKm = (booking: Booking) => {
//     const providerLat = providerProfile?.locationLat
//     const providerLng = providerProfile?.locationLng
//     const bookingUser = booking.user as User & { locationLat?: number; locationLng?: number }
//     if (
//       providerLat == null ||
//       providerLng == null ||
//       bookingUser.locationLat == null ||
//       bookingUser.locationLng == null
//     ) {
//       return null
//     }
//     const earthRadiusKm = 6371
//     const dLat = toRadians(bookingUser.locationLat - providerLat)
//     const dLng = toRadians(bookingUser.locationLng - providerLng)
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(toRadians(providerLat)) *
//       Math.cos(toRadians(bookingUser.locationLat)) *
//       Math.sin(dLng / 2) *
//       Math.sin(dLng / 2)
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//     return Math.round(earthRadiusKm * c * 10) / 10
//   }

//   // --- Grouping Logic Helper ---
//   const groupBookings = (list: Booking[], sortForDistance: boolean) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first initially
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateB = parseCreatedAt(b.createdAt)?.getTime() ?? 0
//       const dateA = parseCreatedAt(a.createdAt)?.getTime() ?? 0
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.user.id === booking.user.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           // Determine status for the group
//           // For accepted group, we consider it efficient to track if any are still not completed?
//           // Or just group them.

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             user: booking.user,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? min(dates) : null,
//             latestDate: dates.length > 0 ? max(dates) : null,
//             createdAt: booking.createdAt,
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups.sort((a, b) => {
//       if (sortForDistance && activeJobTab === 'nearby') {
//         const bA = (a as BookingGroup).isGroup ? (a as BookingGroup).bookings[0] : (a as Booking)
//         const bB = (b as BookingGroup).isGroup ? (b as BookingGroup).bookings[0] : (b as Booking)
//         const dA = calculateDistanceKm(bA) ?? 9999
//         const dB = calculateDistanceKm(bB) ?? 9999
//         return dA - dB
//       }
//       const dateB = parseCreatedAt(b.createdAt)?.getTime() ?? 0
//       const dateA = parseCreatedAt(a.createdAt)?.getTime() ?? 0
//       return dateB - dateA
//     })
//   }

//   const availableGroups = useMemo(() => groupBookings(availableJobs, true), [availableJobs, activeJobTab, providerProfile])

//   // Filter accepted jobs that are NOT completed
//   const acceptedJobsList = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
//   const upcomingGroups = useMemo(() => groupBookings(acceptedJobsList, false), [acceptedJobsList])

//   // Get service icon and color
//   const getServiceInfo = (serviceType: string) => {
//     return SERVICE_MAPPING[serviceType] || SERVICE_MAPPING.OTHER
//   }

//   const estimateDurationMinutes = (booking: Booking) => {
//     const variable = booking.note ? Math.min(90, Math.ceil(booking.note.length / 40) * 10) : 0
//     return 30 + variable
//   }

//   // Unused helper removed



//   // Render Helper for Job/Group Card
//   const renderJobCard = (item: Booking | BookingGroup, isAccepted: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const price = extractPriceFromNote(booking.note) || providerProfile?.basePrice
//     const distance = calculateDistanceKm(booking)
//     const estimatedMinutes = estimateDurationMinutes(booking)

//     // Timer for pending single bookings
//     const remainingTime = !isGroup && booking.status === 'REQUESTED' ? getRemainingTime(booking.createdAt) : null

//     // Dynamic Styles based on Service Color
//     const borderColor = isGroup ? serviceInfo.color : '#e2e8f0' // slate-200
//     const bgColor = isGroup ? `${serviceInfo.color}08` : '#ffffff' // 5% opacity
//     const badgeColor = serviceInfo.color

//     return (
//       <div
//         key={isGroup ? group!.id : booking.id}
//         className="bg-card rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all relative overflow-hidden mb-4 cursor-pointer"
//         style={{
//           borderColor: isGroup ? `${borderColor}50` : borderColor,
//           backgroundColor: bgColor
//         }}
//         onClick={() => {
//           if (isGroup) {
//             handleGroupClick(group!)
//           } else {
//             handleJobClick(booking)
//           }
//         }}
//       >
//         {/* Group Indicator Strip */}
//         {isGroup && (
//           <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: badgeColor }}></div>
//         )}

//         <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
//           {/* Left Content */}
//           <div className="flex gap-4 flex-1 min-w-0 pr-2">
//             <div
//               className="size-14 rounded-2xl flex items-center justify-center shrink-0"
//               style={{ backgroundColor: `${serviceInfo.color}15` }}
//             >
//               <ServiceIcon size={24} color={serviceInfo.color} />
//             </div>
//             <div className="min-w-0 flex-1">
//               <div className="flex items-center gap-2 mb-1 flex-wrap">
//                 <h3 className="font-bold text-text-dark text-lg whitespace-nowrap">
//                   {serviceInfo.label}
//                 </h3>
//                 <span
//                   className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
//                   style={{
//                     backgroundColor: `${serviceInfo.color}15`,
//                     color: serviceInfo.color
//                   }}
//                 >
//                   {booking.serviceType}
//                 </span>
//                 {isGroup && (
//                   <span
//                     className="text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
//                     style={{ backgroundColor: badgeColor }}
//                   >
//                     Package ({group!.bookings.length})
//                   </span>
//                 )}
//                 {/* Timer Badge */}
//                 {remainingTime && (
//                   <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
//                     <span className="material-symbols-outlined text-[14px]">timer</span>
//                     {remainingTime}
//                   </span>
//                 )}
//               </div>

//               <p className="text-sm text-text-muted flex items-center gap-1 mb-2 truncate">
//                 <span className="material-symbols-outlined text-base shrink-0">location_on</span>
//                 <span className="truncate">
//                   {distance != null ? `${distance} km away` : booking.user.city ? `In ${booking.user.city}` : 'Location pending'} • {booking.user.city || 'Address pending'}
//                 </span>
//               </p>

//               {/* Customer Contact - Only visible if Accepted or In Progress */}
//               {(booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && (
//                 <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100/50">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="material-symbols-outlined text-base text-gray-500">person</span>
//                     <span className="text-sm font-semibold text-gray-700">{booking.user.name}</span>
//                   </div>
//                   {booking.user.phone && (
//                     <div className="flex items-center gap-2">
//                       <span className="material-symbols-outlined text-base text-gray-500">call</span>
//                       <span className="text-sm text-gray-600">{booking.user.phone}</span>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Date Display */}
//               {isGroup ? (
//                 <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: serviceInfo.color }}>
//                   <CalendarIcon size={16} color={serviceInfo.color} />
//                   <span>
//                     {group!.earliestDate && group!.latestDate
//                       ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                       : 'Dates Pending'}
//                   </span>
//                 </div>
//               ) : (
//                 <div className="text-sm text-gray-500 mb-1">
//                   Request Date: {(() => {
//                     const d = new Date(booking.bookingDate || '');
//                     return !isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : 'Date pending';
//                   })()}
//                 </div>
//               )}

//               <p className="text-sm text-text-dark line-clamp-2 break-words">
//                 {booking.note || 'No additional details provided.'}
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-col items-end justify-between gap-4 min-w-[140px] shrink-0">
//             <div className="text-right">
//               <p className="text-lg font-bold" style={{ color: serviceInfo.color }}>
//                 {isGroup ? 'Package Deal' : (price != null ? `₹${price.toLocaleString()}` : 'Not set')}
//               </p>
//               <p className="text-xs text-text-muted">
//                 {isGroup ? `${group!.bookings.length} x Daily Service` : `Est. ${estimatedMinutes} mins`}
//               </p>
//             </div>

//             {!isAccepted ? (
//               <div className="flex flex-col gap-2 w-full sm:w-auto">
//                 <>
//                   <div className="flex gap-2 w-full sm:w-auto">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         isGroup ? handleBatchReject(group!.bookings.map(b => b.id)) : handleReject(booking.id)
//                       }}
//                       className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
//                     >
//                       Decline
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         isGroup ? handleBatchAccept(group!.bookings.map(b => b.id)) : handleAccept(booking.id)
//                       }}
//                       className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-sm font-medium text-white transition-colors shadow-lg shadow-primary/20`}
//                       style={{ backgroundColor: serviceInfo.color }}>
//                       Accept {isGroup ? 'All' : ''}
//                     </button>
//                   </div>
//                 </>
//               </div>
//             ) : (
//               <div className="flex gap-2 w-full sm:w-auto">
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     if (window.confirm('Are you sure you want to cancel this job? This will trigger a full refund to the user.')) {
//                       bookingService.cancelBooking(booking.id)
//                         .then(() => {
//                           toast.success('Job cancelled and refunded')
//                           fetchData()
//                         })
//                         .catch((err) => {
//                           console.error(err)
//                           toast.error('Failed to cancel job')
//                         })
//                     }
//                   }}
//                   className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 {(!booking.startedAt && booking.status === 'IN_PROGRESS') || booking.status === 'ACCEPTED' ? (
//                   isGroup ? (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         handleGroupClick(group!)
//                       }}
//                       className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">visibility</span>
//                       View
//                     </button>
//                   ) : (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         handleJobClick(booking)
//                       }}
//                       className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">visibility</span>
//                       View
//                     </button>
//                   )
//                 ) : (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       handleComplete(booking.id)
//                     }}
//                     className="px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg shadow-green-600/25 hover:bg-green-500 transition-all active:scale-95 flex items-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">check_circle</span>
//                     Complete Job
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     )
//   }


//   // ... (Rest of component) ...

//   const firstName = user.name.split(' ')[0]

//   if (loading) {
//     return <ProviderDashboardSkeleton />
//   }

//   return (
//     <div className="flex flex-col gap-8">
//       {/* Critical Alerts Section */}
//       {(() => {
//         const criticalCancellations = bookings.filter(b =>
//           (b.status === 'CANCELLED' || b.status === 'REJECTED') &&
//           (b.bookingDate && (isToday(new Date(b.bookingDate)) || new Date(b.bookingDate) > new Date())) &&
//           !dismissedAlertIds.includes(b.id)
//         )

//         if (criticalCancellations.length === 0) return null

//         const handleDismiss = () => {
//           const idsToDismiss = criticalCancellations.map(b => b.id)
//           const newDismissed = [...dismissedAlertIds, ...idsToDismiss]
//           setDismissedAlertIds(newDismissed)
//           localStorage.setItem('dismissedAlertIds', JSON.stringify(newDismissed))
//         }

//         return (
//           <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-500">
//             <div className="flex items-start gap-3">
//               <div className="p-2 bg-red-100 rounded-full shrink-0">
//                 <span className="material-symbols-outlined text-red-600">warning</span>
//               </div>
//               <div className="flex-1">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="text-red-900 font-bold text-lg mb-1">Attention Required</h3>
//                     <p className="text-red-700 text-sm mb-3">
//                       {criticalCancellations.length} upcoming job{criticalCancellations.length > 1 ? 's have' : ' has'} been cancelled or declined recently.
//                     </p>
//                   </div>
//                   <button
//                     onClick={handleDismiss}
//                     className="px-3 py-1 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm"
//                   >
//                     Okay
//                   </button>
//                 </div>
//                 <div className="space-y-2">
//                   {criticalCancellations.map(job => (
//                     <div key={job.id} className="bg-white/60 p-3 rounded-lg flex items-center justify-between border border-red-100">
//                       <div>
//                         <p className="text-red-900 font-medium text-sm">
//                           {job.serviceType} for {job.user.name}
//                         </p>
//                         <p className="text-red-500 text-xs">
//                           Was scheduled for: {job.bookingDate ? format(new Date(job.bookingDate), 'MMM d, yyyy') : 'Pending Date'}
//                         </p>
//                       </div>
//                       <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
//                         {job.status}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )
//       })()}

//       {/* Welcome & Stats Section */}
//       <div>
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div>
//             <p className="text-sm font-medium text-text-muted mb-1">
//               {format(new Date(), 'EEEE, d MMM')}
//             </p>
//             <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">
//               Welcome back, {firstName}!
//             </h1>
//           </div>
//           {providerProfile && (
//             <div className="bg-card rounded-2xl p-4 border border-slate-100 shadow-sm min-w-[300px]">
//               <div className="flex items-center justify-between mb-2">
//                 <h3 className="font-semibold text-text-dark text-sm">Your Status</h3>
//                 <div className={`size-2.5 rounded-full ${providerProfile.isAvailable ? 'bg-success' : 'bg-warning'}`}></div>
//               </div>
//               <p className="text-xs text-text-muted mb-3">
//                 {providerProfile.isAvailable
//                   ? 'Accepting jobs'
//                   : 'Not accepting jobs'}
//               </p>
//               <button
//                 disabled={isUpdatingAvailability || !providerProfile.isApproved}
//                 onClick={() => handleAvailabilityToggle(!providerProfile.isAvailable)}
//                 className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${providerProfile.isAvailable
//                   ? 'bg-warning/10 text-warning hover:bg-warning/20'
//                   : 'bg-success/10 text-success hover:bg-success/20'
//                   } ${!providerProfile.isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
//               >
//                 {providerProfile.isAvailable ? 'Go Offline' : 'Go Online'}
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Stats Cards ... (Keep existing stats code) */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* ... Paste existing stats cards here for brevity in diff ... */}
//           <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-orange/30 transition-all">
//             <div>
//               <p className="text-sm font-medium text-text-muted mb-1">New Requests</p>
//               <h3 className="text-3xl font-bold text-text-dark">{newRequests}</h3>
//             </div>
//             <div className="size-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center text-accent-orange group-hover:scale-110 transition-transform">
//               <span className="material-symbols-outlined">notifications_active</span>
//             </div>
//           </div>
//           <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-teal/30 transition-all">
//             <div>
//               <p className="text-sm font-medium text-text-muted mb-1">Accepted Jobs</p>
//               <h3 className="text-3xl font-bold text-text-dark">{acceptedJobs}</h3>
//             </div>
//             <div className="size-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal group-hover:scale-110 transition-transform">
//               <span className="material-symbols-outlined">assignment_turned_in</span>
//             </div>
//           </div>
//           <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
//             <div>
//               <p className="text-sm font-medium text-text-muted mb-1">Completed Today</p>
//               <h3 className="text-3xl font-bold text-text-dark">{todayCompleted}</h3>
//             </div>
//             <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
//               <span className="material-symbols-outlined">check_circle</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Combined Jobs Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
//         {/* Available jobs section */}
//         <div className="flex flex-col gap-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-bold text-text-dark">Available Jobs</h2>
//             <div className="flex gap-2">
//               <span
//                 className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${activeJobTab === 'nearby'
//                   ? 'text-primary hover:bg-primary/5'
//                   : 'text-text-muted hover:bg-slate-100'
//                   }`}
//                 onClick={() => setActiveJobTab('nearby')}
//               >
//                 Nearby
//               </span>
//               <span
//                 className={`text-sm font-medium px-3 py-1 rounded-lg cursor-pointer transition-colors ${activeJobTab === 'recent'
//                   ? 'text-primary hover:bg-primary/5'
//                   : 'text-text-muted hover:bg-slate-100'
//                   }`}
//                 onClick={() => setActiveJobTab('recent')}
//               >
//                 Recent
//               </span>
//             </div>
//           </div>

//           <div className="space-y-4">
//             {availableGroups.length > 0 ? (
//               availableGroups.map(item => renderJobCard(item, false))
//             ) : (
//               <div className="bg-card rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
//                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
//                   <span className="material-symbols-outlined text-primary text-2xl">inbox</span>
//                 </div>
//                 <h3 className="text-lg font-semibold text-text-dark mb-2">No New Requests</h3>
//                 <p className="text-text-muted mb-4">
//                   You're all caught up! New job requests will appear here when customers book services near you.
//                 </p>
//                 <button
//                   className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-light transition-colors"
//                   onClick={() => navigate('/providers')}
//                 >
//                   Browse All Providers
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Scheduled / Upcoming Section */}
//         <div>
//           <h2 className="text-xl font-bold text-text-dark mb-6">Scheduled & Active Jobs</h2>
//           {upcomingGroups.length > 0 ? (
//             <div className="space-y-4">
//               {upcomingGroups.map(item => renderJobCard(item, true))}
//             </div>
//           ) : (
//             <div className="bg-card rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
//               <p className="text-text-muted">No upcoming jobs scheduled.</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Group Details Modal */}
//       {selectedGroup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedGroup(null)}>
//           <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-6">
//               <div>
//                 <h3 className="text-xl font-bold text-gray-900">Package Details</h3>
//                 <p className="text-sm text-text-muted">{selectedGroup.bookings.length} Services</p>
//               </div>
//               <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
//                 <span className="material-symbols-outlined">close</span>
//               </button>
//             </div>

//             <div className="space-y-4">
//               {selectedGroup.bookings
//                 .sort((a, b) => new Date(a.bookingDate || '').getTime() - new Date(b.bookingDate || '').getTime())
//                 .map((booking, index) => (
//                   <div key={booking.id} className="p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 transition-all">
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="font-semibold text-gray-700">Job #{index + 1}</span>
//                       <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
//                         booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
//                           'bg-gray-100 text-gray-700'
//                         }`}>
//                         {booking.status.replace('_', ' ')}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
//                       <span className="material-symbols-outlined text-base">calendar_today</span>
//                       {booking.bookingDate ? format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy') : 'Date pending'}
//                     </div>
//                     {(booking.status === 'IN_PROGRESS' || booking.status === 'ACCEPTED') && booking.bookingDate && isToday(new Date(booking.bookingDate)) ? (
//                       <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleJobClick(booking)}>
//                         View
//                       </Button>
//                     ) : null}
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>
//       )}


//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { providerService } from '../services/providerService'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { PageLoadingSkeleton } from '../components/ui/Loader'
// import { AlertCircleIcon, CheckIcon, ClockIcon, XCircleIcon } from '../components/icons/CustomIcons'
// import toast from 'react-hot-toast'
// import type { ServiceType, ProviderProfile } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const ProviderProfileCompletion = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [profile, setProfile] = useState<ProviderProfile | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [submitting, setSubmitting] = useState(false)
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     experienceYears: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [fileData, setFileData] = useState({
//     resume: null as File | null,
//     demoVideo: null as File | null,
//   })
//   const [resumePreview, setResumePreview] = useState<string | null>(null)
//   const [demoVideoPreview, setDemoVideoPreview] = useState<string | null>(null)
//   const [errors, setErrors] = useState<Record<string, string>>({})

//   useEffect(() => {
//     fetchProviderProfile()
//   }, [user?.id])

//   const fetchProviderProfile = async () => {
//     if (!user) return
    
//     try {
//       setLoading(true)
//       const providerProfile = await providerService.getProviderByUserId(user.id)
//       setProfile(providerProfile)
      
//       if (providerProfile) {
//         setFormData({
//           serviceType: providerProfile.serviceType || '',
//           description: providerProfile.description || '',
//           experienceYears: providerProfile.experienceYears?.toString() || '',
//           basePrice: providerProfile.basePrice?.toString() || '',
//           locationLat: providerProfile.locationLat?.toString() || '',
//           locationLng: providerProfile.locationLng?.toString() || '',
//         })
        
//         // Set previews if URLs exist
//         if (providerProfile.resumeUrl) {
//           setResumePreview(providerProfile.resumeUrl)
//         }
//         if (providerProfile.demoVideoUrl) {
//           setDemoVideoPreview(providerProfile.demoVideoUrl)
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch provider profile:', error)
//       toast.error('Failed to load provider profile')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
    
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
    
//     if (!formData.experienceYears || isNaN(parseInt(formData.experienceYears))) {
//       newErrors.experienceYears = 'Valid experience years is required'
//     }
    
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
    
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
    
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
    
//     if (!resumePreview) {
//       newErrors.resume = 'Resume is required'
//     }
    
//     if (!demoVideoPreview) {
//       newErrors.demoVideo = 'Demo video is required'
//     }
    
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSaveProfile = async () => {
//     if (!validate() || !user || !profile) return
    
//     setSaving(true)
//     try {
//       const updatedProfile = await providerService.updateProfile(profile.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         experienceYears: parseInt(formData.experienceYears),
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
      
//       setProfile(updatedProfile)
//       toast.success('Profile saved successfully!')
//     } catch (error: any) {
//       console.error('Error saving provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile'
//       toast.error(errorMessage)
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'demoVideo') => {
//     if (!e.target.files || e.target.files.length === 0) return
    
//     const file = e.target.files[0]
//     setFileData(prev => ({ ...prev, [fileType]: file }))
    
//     // Create preview
//     if (fileType === 'resume') {
//       setResumePreview(URL.createObjectURL(file))
//     } else {
//       setDemoVideoPreview(URL.createObjectURL(file))
//     }
//   }

//   const handleUploadFile = async (fileType: 'resume' | 'demoVideo') => {
//     if (!profile || !fileData[fileType]) return
    
//     try {
//       let updatedProfile: ProviderProfile
      
//       if (fileType === 'resume') {
//         updatedProfile = await providerService.uploadResume(profile.id, fileData.resume!)
//       } else {
//         updatedProfile = await providerService.uploadDemoVideo(profile.id, fileData.demoVideo!)
//       }
      
//       setProfile(updatedProfile)
//       toast.success(`${fileType === 'resume' ? 'Resume' : 'Demo video'} uploaded successfully!`)
      
//       // Clear the file input
//       setFileData(prev => ({ ...prev, [fileType]: null }))
//     } catch (error: any) {
//       console.error(`Error uploading ${fileType}:`, error)
      
//       // More detailed error handling
//       let errorMessage = `Failed to upload ${fileType}`;
      
//       if (error.response) {
//         // Server responded with error status
//         errorMessage = error.response.data?.message || 
//                       error.response.statusText || 
//                       `Server error (${error.response.status})`;
//         console.error('Server response:', error.response);
//       } else if (error.request) {
//         // Request was made but no response received
//         errorMessage = 'Network error - could not reach server';
//         console.error('Network error:', error.request);
//       } else {
//         // Something else happened
//         errorMessage = error.message || 'Unknown error occurred';
//       }
      
//       toast.error(errorMessage)
//     }
//   }

//   const handleSubmitForReview = async () => {
//     if (!profile) return
    
//     // Validate before submitting
//     if (!validate()) {
//       toast.error('Please complete all required fields before submitting')
//       return
//     }
    
//     setSubmitting(true)
//     try {
//       const updatedProfile = await providerService.submitForReview(profile.id)
//       setProfile(updatedProfile)
//       toast.success('Profile submitted for review!')
//     } catch (error: any) {
//       console.error('Error submitting for review:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to submit for review'
//       toast.error(errorMessage)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleCancelSubmission = () => {
//     navigate('/dashboard')
//   }

//   if (loading) {
//     return <PageLoadingSkeleton />
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can access this page</p>
//       </div>
//     )
//   }

//   // If profile is already approved, redirect to dashboard
//   if (profile?.profileStatus === 'APPROVED') {
//     navigate('/dashboard')
//     return null
//   }

//   const isProfileEditable = profile?.profileStatus === 'INCOMPLETE' || profile?.profileStatus === 'REJECTED'
//   const isUnderReview = profile?.profileStatus === 'PENDING_APPROVAL'

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-text-primary mb-2">Complete Your Provider Profile</h1>
//         <p className="text-text-secondary">
//           Fill in all required information and upload documents to submit for admin review.
//         </p>
//       </div>

//       {/* Status Banner */}
//       {profile && (
//         <div className="mb-6">
//           {profile.profileStatus === 'INCOMPLETE' && (
//             <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
//               <div className="flex items-center">
//                 <AlertCircleIcon size={20} color="#FF9D2B" className="mr-2" />
//                 <div>
//                   <p className="font-medium text-warning">Profile Incomplete</p>
//                   <p className="text-sm text-warning">Complete all fields and submit for review</p>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           {profile.profileStatus === 'PENDING_APPROVAL' && (
//             <div className="bg-info/10 border border-info/20 rounded-xl p-4">
//               <div className="flex items-center">
//                 <ClockIcon size={20} color="#00B6D8" className="mr-2" />
//                 <div>
//                   <p className="font-medium text-info">Under Review</p>
//                   <p className="text-sm text-info">Your profile is being reviewed by admins</p>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           {profile.profileStatus === 'REJECTED' && (
//             <div className="bg-error/10 border border-error/20 rounded-xl p-4">
//               <div className="flex items-center">
//                 <XCircleIcon size={20} color="#DC2626" className="mr-2" />
//                 <div className="flex-1">
//                   <p className="font-medium text-error">Profile Rejected</p>
//                   {profile.rejectionReason && (
//                     <p className="text-sm text-error">Reason: {profile.rejectionReason}</p>
//                   )}
//                   <p className="text-sm text-error">Please update your profile and resubmit</p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {/* Profile Information */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Profile Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <Select
//                 label="Service Type *"
//                 value={formData.serviceType}
//                 onChange={(e) =>
//                   setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//                 }
//                 error={errors.serviceType}
//                 options={[
//                   { value: '', label: 'Select a service type' },
//                   ...SERVICE_TYPES,
//                 ]}
//                 disabled={!isProfileEditable}
//               />
              
//               <Textarea
//                 label="Description *"
//                 value={formData.description}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//                 placeholder="Describe your services and expertise..."
//                 rows={4}
//                 disabled={!isProfileEditable}
//                 error={errors.description}
//               />
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Input
//                   label="Experience (years) *"
//                   type="number"
//                   value={formData.experienceYears}
//                   onChange={(e) =>
//                     setFormData({ ...formData, experienceYears: e.target.value })
//                   }
//                   error={errors.experienceYears}
//                   placeholder="5"
//                   disabled={!isProfileEditable}
//                 />
                
//                 <Input
//                   label="Base Price (₹) *"
//                   type="number"
//                   value={formData.basePrice}
//                   onChange={(e) =>
//                     setFormData({ ...formData, basePrice: e.target.value })
//                   }
//                   error={errors.basePrice}
//                   placeholder="500"
//                   disabled={!isProfileEditable}
//                 />
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Input
//                   label="Latitude *"
//                   type="number"
//                   step="any"
//                   value={formData.locationLat}
//                   onChange={(e) =>
//                     setFormData({ ...formData, locationLat: e.target.value })
//                   }
//                   error={errors.locationLat}
//                   placeholder="40.7128"
//                   disabled={!isProfileEditable}
//                 />
                
//                 <Input
//                   label="Longitude *"
//                   type="number"
//                   step="any"
//                   value={formData.locationLng}
//                   onChange={(e) =>
//                     setFormData({ ...formData, locationLng: e.target.value })
//                   }
//                   error={errors.locationLng}
//                   placeholder="-74.0060"
//                   disabled={!isProfileEditable}
//                 />
//               </div>
              
//               {isProfileEditable && (
//                 <div className="pt-4">
//                   <Button
//                     onClick={handleSaveProfile}
//                     isLoading={saving}
//                     disabled={saving}
//                   >
//                     Save Profile
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Document Upload */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Document Upload</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Resume Upload */}
//               <div>
//                 <p className="text-sm font-label text-text-primary mb-2">Resume (PDF) *</p>
//                 {isProfileEditable ? (
//                   <div className="space-y-3">
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="file"
//                         accept=".pdf"
//                         onChange={(e) => handleFileChange(e, 'resume')}
//                         className="flex-1"
//                         disabled={!isProfileEditable}
//                       />
//                       <Button
//                         onClick={() => handleUploadFile('resume')}
//                         disabled={!fileData.resume || !isProfileEditable}
//                         size="sm"
//                       >
//                         Upload
//                       </Button>
//                     </div>
//                     {errors.resume && (
//                       <p className="text-error text-sm">{errors.resume}</p>
//                     )}
//                   </div>
//                 ) : (
//                   <p className="text-text-secondary">Profile is under review. Document upload is disabled.</p>
//                 )}
                
//                 {resumePreview && (
//                   <div className="mt-3 p-3 border border-border rounded-lg">
//                     <p className="text-sm font-medium mb-2">Uploaded Resume:</p>
//                     <a 
//                       href={resumePreview} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="text-primary hover:underline"
//                     >
//                       View Resume
//                     </a>
//                   </div>
//                 )}
//               </div>
              
//               {/* Demo Video Upload */}
//               <div>
//                 <p className="text-sm font-label text-text-primary mb-2">Demo Video (MP4) *</p>
//                 {isProfileEditable ? (
//                   <div className="space-y-3">
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="file"
//                         accept="video/mp4,video/quicktime"
//                         onChange={(e) => handleFileChange(e, 'demoVideo')}
//                         className="flex-1"
//                         disabled={!isProfileEditable}
//                       />
//                       <Button
//                         onClick={() => handleUploadFile('demoVideo')}
//                         disabled={!fileData.demoVideo || !isProfileEditable}
//                         size="sm"
//                       >
//                         Upload
//                       </Button>
//                     </div>
//                     {errors.demoVideo && (
//                       <p className="text-error text-sm">{errors.demoVideo}</p>
//                     )}
//                   </div>
//                 ) : (
//                   <p className="text-text-secondary">Profile is under review. Document upload is disabled.</p>
//                 )}
                
//                 {demoVideoPreview && (
//                   <div className="mt-3 p-3 border border-border rounded-lg">
//                     <p className="text-sm font-medium mb-2">Uploaded Demo Video:</p>
//                     <a 
//                       href={demoVideoPreview} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="text-primary hover:underline"
//                     >
//                       View Demo Video
//                     </a>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Submission Panel */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Profile Status</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {profile ? (
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm text-text-secondary">Current Status</p>
//                     <p className="font-medium capitalize">
//                       {profile.profileStatus.replace('_', ' ').toLowerCase()}
//                     </p>
//                   </div>
                  
//                   {profile.profileStatus === 'REJECTED' && profile.rejectionReason && (
//                     <div>
//                       <p className="text-sm text-text-secondary">Rejection Reason</p>
//                       <p className="font-medium text-error">{profile.rejectionReason}</p>
//                     </div>
//                   )}
                  
//                   <div className="pt-4 space-y-3">
//                     {isProfileEditable && (
//                       <Button
//                         className="w-full"
//                         onClick={handleSubmitForReview}
//                         isLoading={submitting}
//                         disabled={submitting}
//                       >
//                         Submit for Review
//                       </Button>
//                     )}
                    
//                     {isUnderReview && (
//                       <Button
//                         variant="outline"
//                         className="w-full"
//                         onClick={handleCancelSubmission}
//                       >
//                         Back to Dashboard
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <p className="text-text-secondary">Create a profile to see status</p>
//               )}
//             </CardContent>
//           </Card>
          
//           <Card>
//             <CardHeader>
//               <CardTitle>Requirements</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <ul className="space-y-2 text-sm">
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Service type and description</span>
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Years of experience</span>
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Base service price</span>
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Location coordinates</span>
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Resume (PDF format)</span>
//                 </li>
//                 <li className="flex items-center">
//                   <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
//                   <span>Demo video (MP4 format)</span>
//                 </li>
//               </ul>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { providerService } from '../services/providerService'
// import { Card, CardContent } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { PageLoadingSkeleton } from '../components/ui/Loader'
// import { MapPinIcon, CheckIcon, UploadIcon } from '../components/icons/CustomIcons'
// import toast from 'react-hot-toast'
// import type { ServiceType, ProviderProfile } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//     { value: 'PLUMBER', label: 'Plumber' },
//     { value: 'ELECTRICIAN', label: 'Electrician' },
//     { value: 'CLEANER', label: 'Cleaner' },
//     { value: 'LAUNDRY', label: 'Laundry' },
//     { value: 'OTHER', label: 'Other' },
// ]

// export const ProviderProfileSetup = () => {
//     const { user } = useAuth()
//     const navigate = useNavigate()
//     const [profile, setProfile] = useState<ProviderProfile | null>(null)
//     const [loading, setLoading] = useState(true)
//     const [saving, setSaving] = useState(false)
//     const [detectingLocation, setDetectingLocation] = useState(false)

//     const [formData, setFormData] = useState({
//         serviceType: '' as ServiceType | '',
//         description: '',
//         experienceYears: '',
//         basePrice: '',
//         locationLat: '',
//         locationLng: '',
//         detectedAddress: '',
//     })

//     const [fileData, setFileData] = useState({
//         aadharFront: null as File | null,
//         aadharBack: null as File | null,
//         demoVideo: null as File | null,
//     })

//     const [filePreview, setFilePreview] = useState({
//         aadharFront: null as string | null,
//         aadharBack: null as string | null,
//         demoVideo: null as string | null,
//     })

//     const [portfolioImages, setPortfolioImages] = useState<{ id: number; url: string }[]>([])

//     const [errors, setErrors] = useState<Record<string, string>>({})
//     const [step, setStep] = useState(1) // 1: Info, 2: Location, 3: Documents

//     useEffect(() => {
//         fetchProviderProfile()
//     }, [user?.id])

//     const fetchProviderProfile = async () => {
//         if (!user) return

//         try {
//             setLoading(true)
//             const providerProfile = await providerService.getProviderByUserId(user.id)

//             if (providerProfile) {
//                 setProfile(providerProfile)
//                 setFormData({
//                     serviceType: providerProfile.serviceType || '',
//                     description: providerProfile.description || '',
//                     experienceYears: providerProfile.experienceYears?.toString() || '',
//                     basePrice: providerProfile.basePrice?.toString() || '',
//                     locationLat: providerProfile.locationLat?.toString() || '',
//                     locationLng: providerProfile.locationLng?.toString() || '',
//                     detectedAddress: '',
//                 })

//                 if (providerProfile.aadharFrontUrl) {
//                     setFilePreview(prev => ({ ...prev, aadharFront: providerProfile.aadharFrontUrl || null }))
//                 }
//                 if (providerProfile.aadharBackUrl) {
//                     setFilePreview(prev => ({ ...prev, aadharBack: providerProfile.aadharBackUrl || null }))
//                 }
//                 if (providerProfile.demoVideoUrl) {
//                     setFilePreview(prev => ({ ...prev, demoVideo: providerProfile.demoVideoUrl || null }))
//                 }

//                 // Load portfolio images
//                 if (providerProfile.portfolioImages && providerProfile.portfolioImages.length > 0) {
//                     const imagesWithIds = providerProfile.portfolioImages.map((url, index) => ({
//                         id: index + 1,
//                         url: `http://localhost:3000${url}`
//                     }))
//                     setPortfolioImages(imagesWithIds)
//                 }
//             }
//         } catch (error) {
//             console.error('Failed to fetch provider profile:', error)
//         } finally {
//             setLoading(false)
//         }
//     }

//     const handleDetectLocation = () => {
//         if (!navigator.geolocation) {
//             toast.error('Geolocation is not supported by your browser')
//             return
//         }

//         setDetectingLocation(true)
//         navigator.geolocation.getCurrentPosition(
//             async (position) => {
//                 const { latitude, longitude } = position.coords
//                 setFormData(prev => ({
//                     ...prev,
//                     locationLat: latitude.toString(),
//                     locationLng: longitude.toString(),
//                 }))

//                 // Try to get address from coordinates (reverse geocoding) with fallback
//                 let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
//                 let success = false

//                 // Strategy 1: BigDataCloud
//                 try {
//                     const response = await fetch(
//                         `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//                     )
//                     if (response.ok) {
//                         const data = await response.json()
//                         const parts = [
//                             data.locality || data.city,
//                             data.principalSubdivision,
//                             data.countryName
//                         ].filter(Boolean)

//                         if (parts.length > 0) {
//                             address = parts.join(', ')
//                             success = true
//                         }
//                     }
//                 } catch (e) {
//                     console.warn('BigDataCloud failed, trying fallback...', e)
//                 }

//                 // Strategy 2: Nominatim Fallback (if first failed)
//                 if (!success) {
//                     try {
//                         const response = await fetch(
//                             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
//                         )
//                         if (response.ok) {
//                             const data = await response.json()
//                             const addr = data.address || {}
//                             const parts = [
//                                 addr.road || addr.street,
//                                 addr.suburb || addr.neighbourhood,
//                                 addr.city || addr.town || addr.village,
//                                 addr.state,
//                                 addr.country
//                             ].filter(Boolean)

//                             if (parts.length > 0) {
//                                 address = parts.join(', ')
//                                 success = true
//                             }
//                         }
//                     } catch (e) {
//                         console.error('Nominatim fallback failed:', e)
//                     }
//                 }

//                 setFormData(prev => ({ ...prev, detectedAddress: address }))
//                 toast.success('Location detected successfully!')
//                 setDetectingLocation(false)
//             },
//             (error) => {
//                 console.error('Geolocation error:', error)
//                 toast.error('Failed to detect location. Please enable location services.')
//                 setDetectingLocation(false)
//             }
//         )
//     }

//     const validate = () => {
//         const newErrors: Record<string, string> = {}

//         if (!formData.serviceType) {
//             newErrors.serviceType = 'Service type is required'
//         }

//         if (!formData.description || formData.description.length < 20) {
//             newErrors.description = 'Description must be at least 20 characters'
//         }

//         if (!formData.experienceYears || isNaN(parseInt(formData.experienceYears)) || parseInt(formData.experienceYears) < 0) {
//             newErrors.experienceYears = 'Valid experience years is required'
//         }

//         if (formData.basePrice && (isNaN(parseInt(formData.basePrice)) || parseInt(formData.basePrice) < 0)) {
//             newErrors.basePrice = 'Base price must be a positive number'
//         }

//         if (!formData.locationLat || !formData.locationLng) {
//             newErrors.location = 'Please detect your location'
//         }

//         if (!filePreview.aadharFront && !profile?.aadharFrontUrl) {
//             newErrors.aadharFront = 'Aadhar Front is required'
//         }

//         if (!filePreview.aadharBack && !profile?.aadharBackUrl) {
//             newErrors.aadharBack = 'Aadhar Back is required'
//         }

//         if (!filePreview.demoVideo && !profile?.demoVideoUrl) {
//             newErrors.demoVideo = 'Demo video is required'
//         }

//         setErrors(newErrors)
//         return Object.keys(newErrors).length === 0
//     }

//     const handleRemoveFile = (fileType: 'aadharFront' | 'aadharBack' | 'demoVideo') => {
//         setFileData(prev => ({ ...prev, [fileType]: null }))
//         setFilePreview(prev => ({ ...prev, [fileType]: null }))
//     }

//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'aadharFront' | 'aadharBack' | 'demoVideo') => {
//         const file = e.target.files?.[0]
//         if (!file) return

//         const maxSize = fileType === 'demoVideo' ? 50 * 1024 * 1024 : 5 * 1024 * 1024 // 5MB for images/PDF, 50MB for video

//         if (file.size > maxSize) {
//             toast.error(`File size should be less than ${maxSize / (1024 * 1024)}MB`)
//             return
//         }

//         setFileData(prev => ({ ...prev, [fileType]: file }))
//         setFilePreview(prev => ({ ...prev, [fileType]: URL.createObjectURL(file) }))
//     }

//     const handleSubmit = async () => {
//         if (!validate() || !user) return

//         if (!user.id) {
//             toast.error('Session invalid. Please log out and log in again.')
//             return
//         }

//         setSaving(true)
//         try {
//             let currentProfile = profile

//             // Step 1: Create or update profile
//             if (!currentProfile) {
//                 currentProfile = await providerService.createProfile(user.id, {
//                     serviceType: formData.serviceType as ServiceType,
//                     description: formData.description,
//                     experienceYears: parseInt(formData.experienceYears),
//                     basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//                     locationLat: parseFloat(formData.locationLat),
//                     locationLng: parseFloat(formData.locationLng),
//                 })
//                 setProfile(currentProfile)
//             } else {
//                 currentProfile = await providerService.updateProfile(currentProfile.id, {
//                     serviceType: formData.serviceType as ServiceType,
//                     description: formData.description,
//                     experienceYears: parseInt(formData.experienceYears),
//                     basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//                     locationLat: parseFloat(formData.locationLat),
//                     locationLng: parseFloat(formData.locationLng),
//                 })
//             }

//             // Step 2: Upload Aadhar Front if new file selected
//             if (fileData.aadharFront) {
//                 currentProfile = await providerService.uploadAadharFront(currentProfile.id, fileData.aadharFront)
//             }

//             // Step 2.5: Upload Aadhar Back if new file selected
//             if (fileData.aadharBack) {
//                 currentProfile = await providerService.uploadAadharBack(currentProfile.id, fileData.aadharBack)
//             }

//             // Step 3: Upload demo video if new file selected
//             if (fileData.demoVideo) {
//                 currentProfile = await providerService.uploadDemoVideo(currentProfile.id, fileData.demoVideo)
//             }

//             // Step 4: Submit for review
//             await providerService.submitForReview(currentProfile.id)

//             toast.success('Profile submitted for review successfully!')
//             navigate('/dashboard')
//         } catch (error: any) {
//             console.error('Error submitting profile:', error)
//             const errorMessage = error.response?.data?.message || error.message || 'Failed to submit profile'
//             toast.error(errorMessage)
//         } finally {
//             setSaving(false)
//         }
//     }

//     if (loading) {
//         return <PageLoadingSkeleton />
//     }

//     if (!user || user.role !== 'PROVIDER') {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <p className="text-text-secondary">Only providers can access this page</p>
//             </div>
//         )
//     }

//     // Check if already approved
//     if (profile?.profileStatus === 'APPROVED') {
//         navigate('/dashboard')
//         return null
//     }

//     const isUnderReview = profile?.profileStatus === 'PENDING_APPROVAL'

//     return (
//         <div className="max-w-4xl mx-auto">
//             <div className="mb-8">
//                 <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Profile Setup</h1>
//                 <p className="text-gray-600">
//                     Complete your professional profile to start receiving bookings
//                 </p>
//             </div>

//             {isUnderReview && (
//                 <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
//                     <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
//                             <CheckIcon size={24} color="#3B82F6" />
//                         </div>
//                         <div>
//                             <h3 className="text-lg font-semibold text-blue-900">Profile Under Review</h3>
//                             <p className="text-blue-700">Your profile is being reviewed by our admin team. You'll be notified once approved.</p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {profile?.profileStatus === 'REJECTED' && (
//                 <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
//                     <h3 className="text-lg font-semibold text-red-900 mb-2">Profile Rejected</h3>
//                     {profile.rejectionReason && (
//                         <p className="text-red-700 mb-3">Reason: {profile.rejectionReason}</p>
//                     )}
//                     <p className="text-red-600">Please update your information and resubmit.</p>
//                 </div>
//             )}

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main Form */}
//                 <div className="lg:col-span-2 space-y-6">
//                     {/* Service Information */}
//                     <Card>
//                         <CardContent className="p-6">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-6">Service Information</h2>

//                             <div className="space-y-5">
//                                 <Select
//                                     label="Service Type *"
//                                     value={formData.serviceType}
//                                     onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })}
//                                     error={errors.serviceType}
//                                     options={[
//                                         { value: '', label: 'Select a service type' },
//                                         ...SERVICE_TYPES,
//                                     ]}
//                                     disabled={isUnderReview}
//                                 />

//                                 <Textarea
//                                     label="Description *"
//                                     value={formData.description}
//                                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                                     error={errors.description}
//                                     placeholder="Describe your services, expertise, and what makes you stand out..."
//                                     rows={5}
//                                     disabled={isUnderReview}
//                                 />

//                                 <div className="grid grid-cols-2 gap-4">
//                                     <Input
//                                         label="Experience (years) *"
//                                         type="number"
//                                         value={formData.experienceYears}
//                                         onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
//                                         error={errors.experienceYears}
//                                         placeholder="5"
//                                         disabled={isUnderReview}
//                                     />

//                                     <Input
//                                         label="Base Price (₹)"
//                                         type="number"
//                                         value={formData.basePrice}
//                                         onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
//                                         error={errors.basePrice}
//                                         placeholder="500"
//                                         disabled={isUnderReview}
//                                     />
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Location */}
//                     <Card>
//                         <CardContent className="p-6">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>

//                             <div className="space-y-4">
//                                 <Button
//                                     type="button"
//                                     onClick={handleDetectLocation}
//                                     isLoading={detectingLocation}
//                                     disabled={detectingLocation || isUnderReview}
//                                     className="w-full"
//                                 >
//                                     <MapPinIcon size={20} color="white" className="mr-2" />
//                                     {detectingLocation ? 'Detecting...' : 'Detect My Location'}
//                                 </Button>

//                                 {formData.detectedAddress && (
//                                     <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//                                         <p className="text-sm text-green-700 font-medium mb-1">Location Detected:</p>
//                                         <p className="text-green-900 flex items-start gap-2">
//                                             <MapPinIcon size={16} color="#059669" className="mt-0.5 flex-shrink-0" />
//                                             <span className="text-sm">{formData.detectedAddress}</span>
//                                         </p>
//                                         <p className="text-xs text-green-600 mt-2">
//                                             Coordinates: {parseFloat(formData.locationLat).toFixed(4)}, {parseFloat(formData.locationLng).toFixed(4)}
//                                         </p>
//                                     </div>
//                                 )}

//                                 {errors.location && (
//                                     <p className="text-red-600 text-sm">{errors.location}</p>
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Documents */}
//                     <Card>
//                         <CardContent className="p-6">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>

//                             <div className="space-y-6">
//                                 {/* Aadhar Front Upload */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-3">
//                                         Aadhar Card Front *
//                                     </label>
//                                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
//                                         {filePreview.aadharFront ? (
//                                             <div className="space-y-3">
//                                                 <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
//                                                     <CheckIcon size={32} color="#059669" />
//                                                 </div>
//                                                 <p className="text-sm text-green-700 font-medium">Aadhar Front uploaded</p>
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <a
//                                                         href={filePreview.aadharFront}
//                                                         target="_blank"
//                                                         rel="noopener noreferrer"
//                                                         className="text-blue-600 hover:underline text-sm"
//                                                     >
//                                                         View Document
//                                                     </a>
//                                                     {!isUnderReview && (
//                                                         <button
//                                                             type="button"
//                                                             onClick={() => handleRemoveFile('aadharFront')}
//                                                             className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
//                                                         >
//                                                             Remove
//                                                         </button>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         ) : (
//                                             <>
//                                                 <UploadIcon size={40} color="#9CA3AF" className="mx-auto mb-3" />
//                                                 <input
//                                                     type="file"
//                                                     accept=".pdf,image/*"
//                                                     onChange={(e) => handleFileChange(e, 'aadharFront')}
//                                                     disabled={isUnderReview}
//                                                     className="hidden"
//                                                     id="aadhar-front-upload"
//                                                 />
//                                                 <label
//                                                     htmlFor="aadhar-front-upload"
//                                                     className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
//                                                 >
//                                                     Click to upload PDF/Image
//                                                 </label>
//                                                 <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
//                                             </>
//                                         )}
//                                     </div>
//                                     {errors.aadharFront && <p className="text-red-600 text-sm mt-2">{errors.aadharFront}</p>}
//                                 </div>

//                                 {/* Aadhar Back Upload */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-3">
//                                         Aadhar Card Back *
//                                     </label>
//                                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
//                                         {filePreview.aadharBack ? (
//                                             <div className="space-y-3">
//                                                 <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
//                                                     <CheckIcon size={32} color="#059669" />
//                                                 </div>
//                                                 <p className="text-sm text-green-700 font-medium">Aadhar Back uploaded</p>
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <a
//                                                         href={filePreview.aadharBack}
//                                                         target="_blank"
//                                                         rel="noopener noreferrer"
//                                                         className="text-blue-600 hover:underline text-sm"
//                                                     >
//                                                         View Document
//                                                     </a>
//                                                     {!isUnderReview && (
//                                                         <button
//                                                             type="button"
//                                                             onClick={() => handleRemoveFile('aadharBack')}
//                                                             className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
//                                                         >
//                                                             Remove
//                                                         </button>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         ) : (
//                                             <>
//                                                 <UploadIcon size={40} color="#9CA3AF" className="mx-auto mb-3" />
//                                                 <input
//                                                     type="file"
//                                                     accept=".pdf,image/*"
//                                                     onChange={(e) => handleFileChange(e, 'aadharBack')}
//                                                     disabled={isUnderReview}
//                                                     className="hidden"
//                                                     id="aadhar-back-upload"
//                                                 />
//                                                 <label
//                                                     htmlFor="aadhar-back-upload"
//                                                     className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
//                                                 >
//                                                     Click to upload PDF/Image
//                                                 </label>
//                                                 <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
//                                             </>
//                                         )}
//                                     </div>
//                                     {errors.aadharBack && <p className="text-red-600 text-sm mt-2">{errors.aadharBack}</p>}
//                                 </div>

//                                 {/* Demo Video Upload */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-3">
//                                         Demo Video (MP4) *
//                                     </label>
//                                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
//                                         {filePreview.demoVideo ? (
//                                             <div className="space-y-3">
//                                                 <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
//                                                     <CheckIcon size={32} color="#059669" />
//                                                 </div>
//                                                 <p className="text-sm text-green-700 font-medium">Demo video uploaded</p>
//                                                 <a
//                                                     href={filePreview.demoVideo}
//                                                     target="_blank"
//                                                     rel="noopener noreferrer"
//                                                     className="text-blue-600 hover:underline text-sm"
//                                                 >
//                                                     View Video
//                                                 </a>
//                                             </div>
//                                         ) : (
//                                             <>
//                                                 <UploadIcon size={40} color="#9CA3AF" className="mx-auto mb-3" />
//                                                 <input
//                                                     type="file"
//                                                     accept="video/mp4,video/quicktime"
//                                                     onChange={(e) => handleFileChange(e, 'demoVideo')}
//                                                     disabled={isUnderReview}
//                                                     className="hidden"
//                                                     id="video-upload"
//                                                 />
//                                                 <label
//                                                     htmlFor="video-upload"
//                                                     className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
//                                                 >
//                                                     Click to upload MP4
//                                                 </label>
//                                                 <p className="text-xs text-gray-500 mt-1">Max size: 50MB</p>
//                                             </>
//                                         )}
//                                     </div>
//                                     {errors.demoVideo && <p className="text-red-600 text-sm mt-2">{errors.demoVideo}</p>}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Sidebar */}
//                 <div className="space-y-6">
//                     <Card>
//                         <CardContent className="p-6">
//                             <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h3>
//                             <ul className="space-y-3 text-sm">
//                                 {[
//                                     'Service type & description',
//                                     'Years of experience',
//                                     'Base service price',
//                                     'Your location',
//                                     'Aadhar Front (PDF/Image)',
//                                     'Aadhar Back (PDF/Image)',
//                                     'Demo video (MP4 format)',
//                                 ].map((item, idx) => (
//                                     <li key={idx} className="flex items-start gap-2">
//                                         <CheckIcon size={16} color="#10B981" className="mt-0.5 flex-shrink-0" />
//                                         <span className="text-gray-600">{item}</span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </CardContent>
//                     </Card>

//                     {!isUnderReview && (
//                         <Button
//                             onClick={handleSubmit}
//                             isLoading={saving}
//                             disabled={saving}
//                             className="w-full"
//                         >
//                             {saving ? 'Submitting...' : 'Submit for Review'}
//                         </Button>
//                     )}

//                     <Button
//                         variant="outline"
//                         onClick={() => navigate('/dashboard')}
//                         className="w-full"
//                     >
//                         {isUnderReview ? 'Back to Dashboard' : 'Cancel'}
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     )
// }

// import { useEffect, useState } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { adminService } from '../services/adminService'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Textarea } from '../components/ui/Textarea'
// import { PageLoadingSkeleton } from '../components/ui/Loader'
// import { ArrowLeftIcon, CheckIcon, XCircleIcon } from '../components/icons/CustomIcons'
// import type { ProviderProfile } from '../types'

// export const ProviderReviewDetail = () => {
//   const { id } = useParams<{ id: string }>()
//   const navigate = useNavigate()
//   const [provider, setProvider] = useState<ProviderProfile | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [rejectReason, setRejectReason] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   useEffect(() => {
//     if (id) {
//       fetchProvider(parseInt(id))
//     }
//   }, [id])

//   const fetchProvider = async (providerId: number) => {
//     try {
//       setLoading(true)
//       const providerData = await adminService.getProvider(providerId)
//       setProvider(providerData)
//     } catch (err) {
//       console.error('Failed to fetch provider:', err)
//       setError('Failed to load provider details')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleApprove = async () => {
//     if (!provider) return

//     try {
//       setIsSubmitting(true)
//       await adminService.decideProvider(provider.id, 'APPROVE')
//       navigate('/admin')
//     } catch (err) {
//       console.error('Failed to approve provider:', err)
//       setError('Failed to approve provider')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleReject = async () => {
//     if (!provider) return

//     try {
//       setIsSubmitting(true)
//       await adminService.decideProvider(provider.id, 'REJECT', rejectReason)
//       navigate('/admin')
//     } catch (err) {
//       console.error('Failed to reject provider:', err)
//       setError('Failed to reject provider')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleBack = () => {
//     navigate('/admin')
//   }

//   if (loading) {
//     return <PageLoadingSkeleton />
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <p className="text-error mb-4">{error}</p>
//           <Button onClick={() => id && fetchProvider(parseInt(id))}>Retry</Button>
//         </div>
//       </div>
//     )
//   }

//   if (!provider) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <p className="text-error mb-4">Provider not found</p>
//           <Button onClick={handleBack}>Back to Dashboard</Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-4xl mx-auto">
//       <div className="mb-6">
//         <Button
//           variant="ghost"
//           onClick={handleBack}
//           className="mb-4"
//         >
//           <ArrowLeftIcon size={16} color="#5B21B6" className="mr-2" />
//           Back to Dashboard
//         </Button>
//         <h1 className="text-3xl font-bold text-text-primary">Provider Review</h1>
//         <p className="text-text-secondary">Review provider application before approval</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 space-y-6">
//           {/* Provider Information */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Provider Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-text-secondary">Service Type</p>
//                   <p className="font-medium">{provider.serviceType}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-text-secondary">Experience</p>
//                   <p className="font-medium">{provider.experienceYears} years</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-text-secondary">Base Price</p>
//                   <p className="font-medium">₹{provider.basePrice}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-text-secondary">Status</p>
//                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
//                     {provider.profileStatus}
//                   </span>
//                 </div>
//               </div>

//               <div>
//                 <p className="text-sm text-text-secondary">Description</p>
//                 <p className="font-medium">{provider.description || 'No description provided'}</p>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Files Preview */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Uploaded Documents</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <p className="text-sm text-text-secondary mb-2">Resume</p>
//                 {provider.resumeUrl ? (
//                   <div className="border border-border rounded-lg p-4">
//                     <p className="text-sm font-medium mb-2">Resume.pdf</p>
//                     <a
//                       href={provider.resumeUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-primary hover:underline"
//                     >
//                       View Resume
//                     </a>
//                   </div>
//                 ) : (
//                   <p className="text-text-secondary">No resume uploaded</p>
//                 )}
//               </div>

//               <div>
//                 <p className="text-sm text-text-secondary mb-2">Demo Video</p>
//                 {provider.demoVideoUrl ? (
//                   <div className="border border-border rounded-lg p-4">
//                     <p className="text-sm font-medium mb-2">Demo.mp4</p>
//                     <a
//                       href={provider.demoVideoUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-primary hover:underline"
//                     >
//                       View Demo Video
//                     </a>
//                   </div>
//                 ) : (
//                   <p className="text-text-secondary">No demo video uploaded</p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Review Actions */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Review Actions</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <p className="text-sm text-text-secondary">
//                 Please review the provider's information and documents before making a decision.
//               </p>

//               <div className="pt-4 space-y-3">
//                 <Button
//                   className="w-full"
//                   onClick={handleApprove}
//                   disabled={isSubmitting}
//                 >
//                   <CheckIcon size={16} color="white" className="mr-2" />
//                   Approve Provider
//                 </Button>

//                 <Textarea
//                   label="Rejection Reason (Optional)"
//                   value={rejectReason}
//                   onChange={(e) => setRejectReason(e.target.value)}
//                   placeholder="Provide a reason for rejection..."
//                   rows={3}
//                 />

//                 <Button
//                   variant="outline"
//                   className="w-full"
//                   onClick={handleReject}
//                   disabled={isSubmitting}
//                 >
//                   <XCircleIcon size={16} color="#DC2626" className="mr-2" />
//                   Reject Provider
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { Card, CardContent } from '../components/ui/Card'
// import { Badge } from '../components/ui/Badge'
// import { Button } from '../components/ui/Button'
// import { Select } from '../components/ui/Select'
// import { ProvidersSkeleton } from '../components/ui/Loader'
// import { ProviderDetailModal } from '../components/ProviderDetailModal'
// import { providerService } from '../services/providerService'
// import { useAuth } from '../contexts/AuthContext'
// import { useLocation } from '../contexts/LocationContext'
// import toast from 'react-hot-toast'
// import type { ProviderProfile, ServiceType } from '../types'
// import { MapPinIcon, StarIcon, ClockIcon, ImageIcon } from '../components/icons/CustomIcons'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const Providers = () => {
//   const { user } = useAuth()
//   const { addressLocation } = useLocation()
//   const [providers, setProviders] = useState<ProviderProfile[]>([])
//   const [filteredProviders, setFilteredProviders] = useState<ProviderProfile[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>('')
//   const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)
//   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
//   const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
//   const [isLocationChecked, setIsLocationChecked] = useState(false)

//   // Get user's current location
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           console.log('User location obtained:', position.coords.latitude, position.coords.longitude)
//           setUserLocation({
//             lat: Number(position.coords.latitude.toFixed(4)),
//             lng: Number(position.coords.longitude.toFixed(4)),
//           })
//           setIsLocationChecked(true)
//         },
//         (error) => {
//           console.error('Error getting location:', error)
//           // Fallback to city-based filtering
//           setIsLocationChecked(true)
//         }
//       )
//     } else {
//       console.log('Geolocation is not supported by this browser')
//       setIsLocationChecked(true)
//     }
//   }, [])

//   useEffect(() => {
//     if (isLocationChecked) {
//       console.log('Location check complete. Fetching providers with location:', userLocation, 'or city:', user?.city)
//       fetchProviders()
//     }
//   }, [isLocationChecked, userLocation, user?.city])

//   // Re-fetch providers when user city or address location changes (e.g., when address is updated via EditLocationModal)
//   useEffect(() => {
//     if ((user?.city || addressLocation) && isLocationChecked) {
//       fetchProviders()
//     }
//   }, [user?.city, addressLocation])

//   useEffect(() => {
//     filterProviders()
//   }, [providers, selectedServiceType])

//   const fetchProviders = async () => {
//     try {
//       setIsLoading(true)

//       let data: ProviderProfile[]
//       // Use address location if available (from address change), otherwise use geolocation
//       const locationToUse = addressLocation || userLocation
//       if (locationToUse) {
//         // Round coordinates to 4 decimal places (~11m precision) to ensure cache validity
//         // This prevents minor GPS variations from creating new cache keys
//         const roundedLat = Number(locationToUse.lat.toFixed(4))
//         const roundedLng = Number(locationToUse.lng.toFixed(4))

//         console.log(`Fetching providers within 30km of (${roundedLat}, ${roundedLng})`)
//         data = await providerService.getAllProviders(
//           undefined,
//           roundedLat,
//           roundedLng,
//           30
//         )
//       } else if (user?.city) {
//         console.log('Fetching providers in city:', user.city)
//         data = await providerService.getAllProviders(user.city)
//       } else {
//         console.log('No location or city info available.')
//         data = []
//       }

//       console.log('Fetched providers:', data)
//       setProviders(data)
//     } catch (error: any) {
//       console.error('Error fetching providers:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to load providers'
//       toast.error(errorMessage)
//       setProviders([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const filterProviders = () => {
//     let filtered = providers

//     if (selectedServiceType) {
//       filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
//     }

//     setFilteredProviders(filtered)
//   }

//   const handleViewDetails = (provider: ProviderProfile) => {
//     setSelectedProvider(provider)
//     setIsDetailModalOpen(true)
//   }

//   if (isLoading || !isLocationChecked) {
//     return <ProvidersSkeleton />
//   }

//   return (
//     <div>
//       <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//         <h1 className="text-3xl font-bold text-gray-900">Browse Providers</h1>
//         <div className="w-full sm:w-64">
//           <Select
//             value={selectedServiceType}
//             onChange={(e) =>
//               setSelectedServiceType(e.target.value as ServiceType | '')
//             }
//             options={[
//               { value: '', label: 'All Services' },
//               ...SERVICE_TYPES,
//             ]}
//           />
//         </div>
//       </div>

//       {providers.length === 0 ? (
//         <Card>
//           <CardContent className="p-12 text-center">
//             <p className="text-gray-500 mb-2">No providers found</p>
//             {user?.city ? (
//               <p className="text-sm text-gray-400">
//                 No providers available in {user.city}. Try updating your location or check back later.
//               </p>
//             ) : (
//               <p className="text-sm text-gray-400">
//                 Please set your location in your profile to see providers near you.
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       ) : filteredProviders.length === 0 ? (
//         <Card>
//           <CardContent className="p-12 text-center">
//             <p className="text-gray-500 mb-2">No providers found for selected service</p>
//             <p className="text-sm text-gray-400">
//               Try selecting a different service type from the filter above.
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredProviders.map((provider) => {
//             const portfolioImage = provider.portfolioImages?.[0]
//             const hasImage = !!portfolioImage

//             return (
//               <Card
//                 key={provider.id}
//                 className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
//                 onClick={() => handleViewDetails(provider)}
//               >
//                 {/* Portfolio Image Header */}
//                 <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
//                   {hasImage ? (
//                     <img
//                       src={portfolioImage}
//                       alt={`${provider.user?.name || 'Provider'}'s work`}
//                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <ImageIcon size={48} color="#9CA3AF" />
//                     </div>
//                   )}
//                   <div className="absolute top-3 right-3">
//                     <Badge
//                       variant={provider.isAvailable ? 'success' : 'default'}
//                       className="shadow-lg"
//                     >
//                       {provider.isAvailable ? 'Available' : 'Busy'}
//                     </Badge>
//                   </div>
//                 </div>

//                 <CardContent className="p-5">
//                   {/* Provider Name & Service */}
//                   <div className="mb-3">
//                     <h3 className="text-xl font-bold text-gray-900 mb-1">
//                       {provider.user?.name || 'Provider'}
//                     </h3>
//                     <div className="flex items-center gap-2 text-sm text-gray-600">
//                       <span className="font-medium">
//                         {SERVICE_TYPES.find((st) => st.value === provider.serviceType)
//                           ?.label || provider.serviceType}
//                       </span>
//                       {provider.experienceYears && (
//                         <>
//                           <span>•</span>
//                           <span className="flex items-center gap-1">
//                             <ClockIcon size={14} />
//                             {provider.experienceYears} yrs exp
//                           </span>
//                         </>
//                       )}
//                     </div>
//                   </div>

//                   {/* Description */}
//                   {provider.description && (
//                     <p className="text-sm text-gray-600 mb-4 line-clamp-2">
//                       {provider.description}
//                     </p>
//                   )}

//                   {/* Rating & Price */}
//                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
//                     <div className="flex items-center gap-1">
//                       <StarIcon size={18} color="#FCD34D" />
//                       <span className="text-lg font-bold text-gray-900">
//                         {provider.rating.toFixed(1)}
//                       </span>
//                       <span className="text-sm text-gray-500">/5.0</span>
//                     </div>
//                     {provider.basePrice && (
//                       <div className="text-right">
//                         <div className="text-xl font-bold text-blue-600">
//                           ₹{provider.basePrice}
//                         </div>
//                         <div className="text-xs text-gray-500">base price</div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Location */}
//                   <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
//                     <MapPinIcon size={16} />
//                     <span>{provider.user?.city || 'Location not set'}</span>
//                   </div>

//                   {/* CTA Button */}
//                   <Button
//                     className="w-full"
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       handleViewDetails(provider)
//                     }}
//                   >
//                     View Details →
//                   </Button>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       )}

//       {/* Provider Detail Modal */}
//       <ProviderDetailModal
//         isOpen={isDetailModalOpen}
//         onClose={() => {
//           setIsDetailModalOpen(false)
//           setSelectedProvider(null)
//         }}
//         provider={selectedProvider}
//         userId={user?.id}
//         userRole={user?.role}
//       />
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Badge } from '../components/ui/Badge'
// import { Button } from '../components/ui/Button'
// import { Textarea } from '../components/ui/Textarea'
// import { ReviewsSkeleton } from '../components/ui/Loader'
// import { Modal } from '../components/ui/Modal'
// import { reviewService } from '../services/reviewService'
// import { bookingService } from '../services/bookingService'
// import { useAuth } from '../contexts/AuthContext'
// import toast from 'react-hot-toast'
// import type { Review, Booking } from '../types'
// import { StarIcon, MessageSquareIcon } from '../components/icons/CustomIcons'

// export const Reviews = () => {
//   const { user } = useAuth()
//   const [reviews, setReviews] = useState<Review[]>([])
//   const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [punctualityRating, setPunctualityRating] = useState(5)
//   const [proficiencyRating, setProficiencyRating] = useState(5)
//   const [etiquetteRating, setEtiquetteRating] = useState(5)
//   const [comment, setComment] = useState('')

//   useEffect(() => {
//     if (user?.role === 'PROVIDER') {
//       fetchReviews()
//     } else {
//       fetchCompletedBookings()
//     }
//   }, [user])

//   const fetchReviews = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       const data = await reviewService.getReviewsByProvider(user.id)
//       setReviews(data)
//     } catch (error) {
//       toast.error('Failed to load reviews')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchCompletedBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       const bookings = await bookingService.getBookingsByUser(user.id)
//       const completed = bookings.filter((b) => b.status === 'COMPLETED')
//       setCompletedBookings(completed)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedBooking.id,
//         rating,
//         punctualityRating,
//         proficiencyRating,
//         etiquetteRating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsModalOpen(false)
//       setSelectedBooking(null)
//       setRating(5)
//       setPunctualityRating(5)
//       setProficiencyRating(5)
//       setEtiquetteRating(5)
//       setComment('')
//       fetchCompletedBookings()
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }

//   if (isLoading) {
//     return <ReviewsSkeleton />
//   }

//   if (user?.role === 'PROVIDER') {
//     return (
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900 mb-6">Reviews</h1>
//         {reviews.length === 0 ? (
//           <Card>
//             <CardContent className="p-12 text-center">
//               <MessageSquareIcon size={48} color="#9CA3AF" className="mx-auto mb-4" />
//               <p className="text-gray-500">No reviews yet</p>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="space-y-4">
//             {reviews.map((review) => (
//               <Card key={review.id}>
//                 <CardContent className="p-6">
//                   <div className="flex items-start gap-4">
//                     {/* Reviewer Avatar Placeholder */}
//                     <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
//                       {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'U'}
//                     </div>

//                     <div className="flex-1">
//                       <div className="flex items-center justify-between mb-2">
//                         <h4 className="font-semibold text-gray-900">
//                           {review.reviewerName || 'Anonymous'}
//                         </h4>
//                         <span className="text-sm text-gray-500">
//                           {new Date(review.createdAt).toLocaleDateString()}
//                         </span>
//                       </div>

//                       <div className="flex items-center gap-1 mb-3">
//                         {[...Array(5)].map((_, i) => (
//                           <StarIcon
//                             key={i}
//                             size={16}
//                             color={i < review.rating ? '#FCD34D' : '#D1D5DB'}
//                           />
//                         ))}
//                         <span className="text-sm font-medium ml-1 text-gray-700">{review.rating.toFixed(1)}</span>
//                       </div>

//                       {/* Detailed Ratings */}
//                       {(review.punctualityRating || review.proficiencyRating || review.etiquetteRating) && (
//                         <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
//                           <div>
//                             <span className="text-gray-500 block text-xs uppercase tracking-wide">Punctuality</span>
//                             <span className="font-medium">{review.punctualityRating}/5</span>
//                           </div>
//                           <div>
//                             <span className="text-gray-500 block text-xs uppercase tracking-wide">Proficiency</span>
//                             <span className="font-medium">{review.proficiencyRating}/5</span>
//                           </div>
//                           <div>
//                             <span className="text-gray-500 block text-xs uppercase tracking-wide">Etiquette</span>
//                             <span className="font-medium">{review.etiquetteRating}/5</span>
//                           </div>
//                         </div>
//                       )}


//                       {review.comment && (
//                         <p className="text-gray-700">{review.comment}</p>
//                       )}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>
//     )
//   }

//   return (
//     <div>
//       <div className="mb-6 flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-gray-900">Leave a Review</h1>
//       </div>

//       {completedBookings.length === 0 ? (
//         <Card>
//           <CardContent className="p-12 text-center">
//             <MessageSquareIcon size={48} color="#9CA3AF" className="mx-auto mb-4" />
//             <p className="text-gray-500">No completed bookings to review</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {completedBookings.map((booking) => (
//             <Card key={booking.id}>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-semibold text-lg mb-2">
//                       Service: {booking.serviceType}
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Provider: {booking.provider.name}
//                     </p>
//                     <p className="text-sm text-gray-500 mt-1">
//                       Completed: {new Date(booking.completedAt!).toLocaleDateString()}
//                     </p>
//                   </div>
//                   <Button
//                     onClick={() => {
//                       setSelectedBooking(booking)
//                       setIsModalOpen(true)
//                     }}
//                   >
//                     Write Review
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false)
//           setSelectedBooking(null)
//           setRating(5)
//           setPunctualityRating(5)
//           setProficiencyRating(5)
//           setEtiquetteRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedBooking && (
//           <div className="space-y-6">

//             {/* Overall Rating */}
//             <div>
//               <p className="text-sm font-medium text-gray-700 mb-2">Overall Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none transition-transform active:scale-95"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* Punctuality */}
//               <div>
//                 <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Punctuality</p>
//                 <div className="flex gap-1">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <button
//                       key={star}
//                       type="button"
//                       onClick={() => setPunctualityRating(star)}
//                       className="focus:outline-none"
//                     >
//                       <StarIcon
//                         size={20}
//                         color={star <= punctualityRating ? '#FCD34D' : '#D1D5DB'}
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Proficiency */}
//               <div>
//                 <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Proficiency</p>
//                 <div className="flex gap-1">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <button
//                       key={star}
//                       type="button"
//                       onClick={() => setProficiencyRating(star)}
//                       className="focus:outline-none"
//                     >
//                       <StarIcon
//                         size={20}
//                         color={star <= proficiencyRating ? '#FCD34D' : '#D1D5DB'}
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Etiquette */}
//               <div>
//                 <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Etiquette</p>
//                 <div className="flex gap-1">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <button
//                       key={star}
//                       type="button"
//                       onClick={() => setEtiquetteRating(star)}
//                       className="focus:outline-none"
//                     >
//                       <StarIcon
//                         size={20}
//                         color={star <= etiquetteRating ? '#FCD34D' : '#D1D5DB'}
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3 pt-2">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsModalOpen(false)
//                   setSelectedBooking(null)
//                   setRating(5)
//                   setPunctualityRating(5)
//                   setProficiencyRating(5)
//                   setEtiquetteRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { Card, CardContent } from '../components/ui/Card'
// import { Badge } from '../components/ui/Badge'
// import { Button } from '../components/ui/Button'
// import { Select } from '../components/ui/Select'
// import { SelectProviderSkeleton } from '../components/ui/Loader'
// import { PrebookModal } from '../components/PrebookModal'
// import { providerService } from '../services/providerService'
// import { bookingService } from '../services/bookingService'
// import { useAuth } from '../contexts/AuthContext'
// import { useLocation as useLocationContext } from '../contexts/LocationContext'
// import toast from 'react-hot-toast'
// import type { ProviderProfile, ServiceType } from '../types'
// import { ArrowLeftIcon, MapPinIcon, StarIcon, CheckCircleIcon, ClockIcon, ImageIcon } from '../components/icons/CustomIcons'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// // Create SERVICE_TYPE_LABELS from SERVICE_TYPES array
// const SERVICE_TYPE_LABELS: Record<ServiceType, string> = SERVICE_TYPES.reduce((acc, service) => {
//   acc[service.value] = service.label;
//   return acc;
// }, {} as Record<ServiceType, string>);

// export const SelectProvider = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const location = useLocation()
//   const { addressLocation } = useLocationContext()

//   // State for Booking Flow
//   const bookingType = location.state?.bookingType as 'single' | 'weekly' | 'multiple' | undefined
//   const serviceType = location.state?.serviceType as ServiceType | undefined
//   const startDate = location.state?.startDate as string | undefined
//   const endDate = location.state?.endDate as string | undefined

//   const [providers, setProviders] = useState<ProviderProfile[]>([])
//   const [filteredProviders, setFilteredProviders] = useState<ProviderProfile[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>(serviceType || '')

//   // Single Booking State
//   const [isPrebookModalOpen, setIsPrebookModalOpen] = useState(false)
//   const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null)

//   // Multiple Booking State (Cart)
//   const [selectedProviders, setSelectedProviders] = useState<ProviderProfile[]>([])
//   const [isBatchBooking, setIsBatchBooking] = useState(false)

//   // Location State
//   const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
//   const [isLocationChecked, setIsLocationChecked] = useState(false)

//   // Get user's current location
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           console.log('User location obtained:', position.coords.latitude, position.coords.longitude);
//           setUserLocation({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           });
//           setIsLocationChecked(true);
//         },
//         (error) => {
//           console.error('Error getting location:', error);
//           setIsLocationChecked(true);
//         }
//       );
//     } else {
//       setIsLocationChecked(true);
//     }
//   }, []);

//   useEffect(() => {
//     if (isLocationChecked) {
//       fetchProviders()
//     }
//   }, [isLocationChecked, userLocation, user?.city])

//   // Re-fetch providers when user city or address location changes (e.g., when address is updated via EditLocationModal)
//   useEffect(() => {
//     if ((user?.city || addressLocation) && isLocationChecked) {
//       fetchProviders()
//     }
//   }, [user?.city, addressLocation])

//   useEffect(() => {
//     filterProviders()
//   }, [providers, selectedServiceType])

//   const fetchProviders = async () => {
//     try {
//       setIsLoading(true)
//       let data: ProviderProfile[];

//       const targetServiceType = selectedServiceType || serviceType;
//       // Use address location if available (from address change), otherwise use geolocation
//       const locationToUse = addressLocation || userLocation;

//       if (targetServiceType) {
//         // Fetch specific service type
//         if (locationToUse) {
//           data = await providerService.getAvailableProviders(
//             targetServiceType,
//             undefined,
//             locationToUse.lat,
//             locationToUse.lng,
//             30
//           );
//         } else {
//           // Use city or fetch all if no city
//           data = await providerService.getAvailableProviders(
//             targetServiceType,
//             user?.city || undefined
//           );
//         }
//       } else {
//         // Fetch ALL services (no type filter)
//         if (locationToUse) {
//           data = await providerService.getAllProviders(
//             undefined,
//             locationToUse.lat,
//             locationToUse.lng,
//             30
//           );
//         } else {
//           // Use city or fetch all if no city
//           data = await providerService.getAllProviders(
//             user?.city || undefined
//           );
//         }
//       }

//       setProviders(data)
//       setFilteredProviders(data)
//     } catch (error) {
//       toast.error('Failed to load providers')
//       setProviders([])
//       setFilteredProviders([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const filterProviders = () => {
//     let filtered = providers
//     filtered = filtered.filter((p) => p.isAvailable)
//     if (selectedServiceType) {
//       filtered = filtered.filter((p) => p.serviceType === selectedServiceType)
//     }
//     setFilteredProviders(filtered)
//   }

//   // --- Handlers ---

//   const handleProviderClick = (provider: ProviderProfile) => {
//     if (bookingType === 'multiple') {
//       toggleProviderSelection(provider)
//     } else {
//       // Single Booking Flow
//       setSelectedProvider(provider)
//       setIsPrebookModalOpen(true)
//     }
//   }

//   const toggleProviderSelection = (provider: ProviderProfile) => {
//     setSelectedProviders(prev => {
//       const exists = prev.find(p => p.id === provider.id)
//       if (exists) {
//         return prev.filter(p => p.id !== provider.id)
//       } else {
//         return [...prev, provider]
//       }
//     })
//   }

//   const handleSingleBookingSubmit = async (data: {
//     bookingType: 'single' | 'weekly'
//     serviceType: ServiceType
//     date: string
//     time?: string
//     note?: string
//   }) => {
//     if (!user || !selectedProvider) return

//     try {
//       if (data.bookingType === 'weekly') {
//         const startDate = new Date(data.date)
//         let successCount = 0
//         for (let i = 0; i < 7; i++) {
//           const bookingDate = new Date(startDate)
//           bookingDate.setDate(startDate.getDate() + i)
//           try {
//             await bookingService.createBooking(user.id, {
//               providerId: selectedProvider.userId,
//               serviceType: data.serviceType,
//               note: data.note,
//               bookingDate: bookingDate.toISOString().split('T')[0],
//               preferredTime: data.time,
//               multipleBooking: true,
//             })
//             successCount++
//           } catch (error) {
//             console.error(`Failed to create booking for day ${i + 1}`)
//           }
//         }
//         toast.success(`Created ${successCount} weekly bookings successfully!`)
//       } else {
//         await bookingService.createBooking(user.id, {
//           providerId: selectedProvider.userId,
//           serviceType: data.serviceType,
//           note: data.note,
//           bookingDate: data.date,
//           preferredTime: data.time,
//         })
//         toast.success(
//           `Booking request sent to ${SERVICE_TYPE_LABELS[selectedProvider.serviceType]} for ${new Date(data.date).toLocaleDateString()}`
//         )
//       }
//       setIsPrebookModalOpen(false)
//       setSelectedProvider(null)
//       navigate('/bookings')
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to create booking')
//     }
//   }

//   const handleBatchBookingSubmit = async () => {
//     if (!user || !startDate || !endDate || selectedProviders.length === 0) return

//     setIsBatchBooking(true)
//     const start = new Date(startDate)
//     const end = new Date(endDate)
//     const days = []

//     // Generate dates in range
//     for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//       days.push(new Date(d))
//     }

//     let successCount = 0
//     let failCount = 0

//     try {
//       // Loop through each provider and each day
//       for (const provider of selectedProviders) {
//         for (const day of days) {
//           try {
//             await bookingService.createBooking(user.id, {
//               providerId: provider.userId,
//               serviceType: provider.serviceType,
//               note: 'Multiple Booking Package',
//               bookingDate: day.toISOString().split('T')[0],
//               preferredTime: '09:00', // Default time for batch
//               multipleBooking: true,
//             })
//             successCount++
//           } catch (err) {
//             console.error('Failed booking', err)
//             failCount++
//           }
//         }
//       }

//       if (successCount > 0) {
//         toast.success(`Successfully created ${successCount} bookings!`)
//         navigate('/bookings')
//       } else {
//         toast.error('Failed to create bookings. Please try again.')
//       }

//     } catch (error) {
//       console.error('Batch booking fatal error', error)
//       toast.error('An error occurred during booking processing')
//     } finally {
//       setIsBatchBooking(false)
//     }
//   }

//   if (isLoading || !isLocationChecked) {
//     return <SelectProviderSkeleton />
//   }

//   return (
//     <div className="pb-24">
//       <div className="mb-6 flex items-center gap-4">
//         <Button
//           variant="outline"
//           onClick={() => navigate('/dashboard')}
//           className="flex items-center gap-2"
//         >
//           <ArrowLeftIcon size={16} color="#9333EA" />
//           Back
//         </Button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {bookingType === 'multiple' ? 'Select Providers' : 'Select Provider'}
//           </h1>
//           <p className="text-gray-600 mt-1">
//             {bookingType === 'multiple'
//               ? `Booking from ${startDate} to ${endDate}`
//               : 'Choose a provider from your area'}
//           </p>
//         </div>
//       </div>

//       <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
//         <div className="w-full sm:w-64">
//           <Select
//             value={selectedServiceType}
//             onChange={(e) =>
//               setSelectedServiceType(e.target.value as ServiceType | '')
//             }
//             options={[
//               { value: '', label: 'All Services' },
//               ...SERVICE_TYPES,
//             ]}
//           />
//         </div>
//       </div>

//       {filteredProviders.length === 0 ? (
//         <Card>
//           <CardContent className="p-12 text-center">
//             <p className="text-gray-500">No providers found</p>
//             <Button
//               variant="outline"
//               className="mt-4"
//               onClick={() => navigate('/dashboard')}
//             >
//               Go Back
//             </Button>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredProviders.map((provider) => {
//             const isSelected = selectedProviders.some(p => p.id === provider.id)
//             const portfolioImage = provider.portfolioImages?.[0]
//             const hasImage = !!portfolioImage
//             const serviceLabel = SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType

//             return (
//               <Card
//                 key={provider.id}
//                 className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
//                 onClick={() => handleProviderClick(provider)}
//               >
//                 {/* Portfolio Header */}
//                 <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
//                   {hasImage ? (
//                     <img
//                       src={portfolioImage}
//                       alt={`${provider.user?.name || 'Provider'}'s work`}
//                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <ImageIcon size={48} color="#9CA3AF" />
//                     </div>
//                   )}
//                   {/* Selection Indicator (Top Right) */}
//                   {bookingType === 'multiple' && isSelected && (
//                     <div className="absolute top-3 right-3 z-10 bg-white rounded-full p-1 shadow-md">
//                       <CheckCircleIcon size={24} color="#7C3AED" />
//                     </div>
//                   )}
//                 </div>

//                 <CardContent className="p-5">
//                   {/* Header Row: Name & Availability */}
//                   <div className="flex items-start justify-between mb-2">
//                     <div>
//                       <h3 className="text-xl font-bold text-gray-900 mb-1">
//                         {provider.user?.name || 'Provider'}
//                       </h3>
//                       <div className="flex items-center gap-2 text-sm text-gray-600">
//                         <span className="font-medium">{serviceLabel}</span>
//                         {provider.experienceYears && (
//                           <>
//                             <span>•</span>
//                             <span className="flex items-center gap-1">
//                               <ClockIcon size={14} />
//                               {provider.experienceYears} yrs exp
//                             </span>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                     {/* Availability Badge (Only if NOT selected, to avoid clutter) */}
//                     {(!isSelected || bookingType !== 'multiple') && (
//                       <Badge variant={provider.isAvailable ? 'success' : 'default'}>
//                         {provider.isAvailable ? 'Available' : 'Busy'}
//                       </Badge>
//                     )}
//                   </div>

//                   {provider.description && (
//                     <p className="text-sm text-gray-600 mb-4 line-clamp-2">
//                       {provider.description}
//                     </p>
//                   )}

//                   {/* Rating & Price */}
//                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
//                     <div className="flex items-center gap-1">
//                       <StarIcon size={18} color="#FCD34D" />
//                       <span className="text-lg font-bold text-gray-900">
//                         {provider.rating.toFixed(1)}
//                       </span>
//                       <span className="text-sm text-gray-500">/5.0</span>
//                     </div>
//                     {provider.basePrice && (
//                       <div className="text-right">
//                         <div className="text-xl font-bold text-blue-600">
//                           ₹{provider.basePrice}
//                         </div>
//                         <div className="text-xs text-gray-500">base price</div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Location */}
//                   <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
//                     <MapPinIcon size={16} />
//                     <span>{provider.user?.city || 'Location not set'}</span>
//                   </div>

//                   <Button
//                     className="w-full"
//                     variant={isSelected ? 'secondary' : 'primary'}
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       if (!provider.isAvailable) {
//                         toast.error('Provider offline')
//                         return
//                       }
//                       handleProviderClick(provider)
//                     }}
//                     disabled={!provider.isAvailable}
//                   >
//                     {!provider.isAvailable
//                       ? 'Offline'
//                       : bookingType === 'multiple'
//                         ? (isSelected ? 'Remove from List' : 'Add to List')
//                         : 'Select & Prebook'
//                     }
//                   </Button>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       )}

//       {/* Booking Cart / Bottom Bar for Multiple Mode */}
//       {bookingType === 'multiple' && selectedProviders.length > 0 && (
//         <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
//           <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
//             <div>
//               <h4 className="font-bold text-lg">{selectedProviders.length} Providers Selected</h4>
//               <p className="text-gray-400 text-sm">
//                 {startDate} - {endDate} (Creating batch bookings)
//               </p>
//             </div>
//             <Button
//               size="lg"
//               className="bg-white text-gray-900 hover:bg-gray-100"
//               onClick={handleBatchBookingSubmit}
//               disabled={isBatchBooking}
//             >
//               {isBatchBooking ? 'Processing...' : 'Confirm All Bookings'}
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Prebook Modal - Only for Single/Weekly (Not Multiple Batch) */}
//       <PrebookModal
//         isOpen={isPrebookModalOpen}
//         onClose={() => {
//           setIsPrebookModalOpen(false)
//           setSelectedProvider(null)
//         }}
//         onConfirm={handleSingleBookingSubmit}
//         providerId={selectedProvider?.userId}
//         serviceType={selectedProvider?.serviceType}
//       />
//     </div>
//   )
// }

// import { useState, useEffect, useRef } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { bookingService } from '../services/bookingService'
// import { providerService } from '../services/providerService'
// import { Booking, ProviderProfile } from '../types'
// import { TrackingPageSkeleton } from '../components/ui/Loader'
// import { Button } from '../components/ui/Button'
// import { MapPinIcon, PhoneIcon, NavigationIcon } from '../components/icons/CustomIcons'
// import toast from 'react-hot-toast'

// // Declare Leaflet types
// declare global {
//     interface Window {
//         L: any
//     }
// }

// export const TrackServicePage = () => {
//     const { bookingId } = useParams()
//     const navigate = useNavigate()
//     const { user } = useAuth()
//     const [booking, setBooking] = useState<Booking | null>(null)
//     const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null)
//     const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
//     const [isLoading, setIsLoading] = useState(true)
//     const mapContainerRef = useRef<HTMLDivElement>(null)
//     const mapInstanceRef = useRef<any>(null)

//     const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
//     const [isCssLoaded, setIsCssLoaded] = useState(false)
//     const [distance, setDistance] = useState<string | null>(null)

//     useEffect(() => {
//         if (bookingId) {
//             fetchData()
//         }
//     }, [bookingId])
    
//     /* Auto-refresh on booking-related notifications */
//     const { notifications } = useNotifications()
//     const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)
    
//     useEffect(() => {
//         if (notifications.length > 0) {
//             const latest = notifications[0]
//             // Check if this is a new notification we haven't processed yet
//             if (latest.id !== lastProcessedNotificationId) {
//                 // Check if it's a booking-related notification for this specific booking
//                 const isBookingRelated = (latest.title.toLowerCase().includes('booking') ||
//                     latest.message.toLowerCase().includes('booking') ||
//                     latest.message.toLowerCase().includes('job') ||
//                     latest.title.toLowerCase().includes('request') ||
//                     latest.title.toLowerCase().includes('accepted') ||
//                     latest.title.toLowerCase().includes('rejected') ||
//                     latest.title.toLowerCase().includes('cancelled') ||
//                     latest.title.toLowerCase().includes('completed') ||
//                     latest.title.toLowerCase().includes('on the way') ||
//                     latest.title.toLowerCase().includes('arrived') ||
//                     latest.title.toLowerCase().includes('started')) &&
//                     latest.relatedBookingId === Number(bookingId); // Only for this specific booking
                
//                 if (isBookingRelated) {
//                     console.log('New booking notification received for this booking, refreshing...', latest.id)
//                     fetchData()
//                     setLastProcessedNotificationId(latest.id)
//                 }
//             }
//         }
//     }, [notifications, bookingId])

//     useEffect(() => {
//         // Load Leaflet resources
//         const checkResources = () => {
//             const isScriptLoaded = !!window.L
//             const isCssPresent = Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))

//             if (isScriptLoaded) setIsLeafletLoaded(true)
//             if (isCssPresent) setIsCssLoaded(true)

//             return isScriptLoaded && isCssPresent
//         }

//         if (checkResources()) return

//         // Load CSS
//         if (!Array.from(document.getElementsByTagName('link')).some(l => l.href.includes('leaflet.css'))) {
//             const link = document.createElement('link')
//             link.rel = 'stylesheet'
//             link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
//             link.onload = () => setIsCssLoaded(true)
//             document.head.appendChild(link)
//         } else {
//             setIsCssLoaded(true)
//         }

//         // Load Script
//         if (!window.L) {
//             const script = document.createElement('script')
//             script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
//             script.onload = () => setIsLeafletLoaded(true)
//             document.body.appendChild(script)
//         } else {
//             setIsLeafletLoaded(true)
//         }

//         return () => {
//             if (mapInstanceRef.current) {
//                 mapInstanceRef.current.remove()
//                 mapInstanceRef.current = null
//             }
//         }
//     }, [])

//     useEffect(() => {
//         if (isLeafletLoaded && isCssLoaded && providerProfile && userLocation && mapContainerRef.current && !mapInstanceRef.current) {
//             initMap()
//         }
//     }, [isLeafletLoaded, isCssLoaded, providerProfile, userLocation])

//     const fetchData = async () => {
//         try {
//             setIsLoading(true)
//             if (!user) return

//             // Get all bookings for user and find the specific one
//             // Ideally we'd have getBookingById
//             const bookings = await bookingService.getBookingsByUser(user.id)
//             const found = bookings.find(b => b.id === Number(bookingId))

//             if (!found) {
//                 toast.error('Booking not found')
//                 navigate('/bookings')
//                 return
//             }
//             setBooking(found)

//             // Get provider profile
//             if (found.provider) {
//                 const profile = await providerService.getProviderByUserId(found.provider.id)
//                 setProviderProfile(profile)
//             }

//             // Get user location from booking or geocode city
//             if (found.user.locationLat && found.user.locationLng) {
//                 setUserLocation({ lat: found.user.locationLat, lng: found.user.locationLng })
//             } else if (found.user.city) {
//                 geocodeAddress(found.user.city)
//             }

//         } catch (error) {
//             console.error(error)
//             toast.error('Failed to load tracking details')
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     const geocodeAddress = async (address: string) => {
//         try {
//             const response = await fetch(
//                 `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
//                 { headers: { 'User-Agent': 'QuickFix/1.0' } }
//             )
//             const data = await response.json()
//             if (data.length > 0) {
//                 setUserLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
//             }
//         } catch (e) {
//             console.error('Geocoding error', e)
//         }
//     }

//     const initMap = async () => {
//         if (!window.L || !mapContainerRef.current || !providerProfile?.locationLat || !providerProfile?.locationLng || !userLocation) return

//         if (mapInstanceRef.current) {
//             mapInstanceRef.current.remove()
//         }

//         const centerLat = (providerProfile.locationLat + userLocation.lat) / 2
//         const centerLng = (providerProfile.locationLng + userLocation.lng) / 2

//         const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLng], 13)
//         window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

//         // Providers Marker
//         const providerIcon = window.L.divIcon({
//             className: 'custom-marker provider-marker',
//             html: '<div style="background-color: #5B21B6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">P</div>',
//             iconSize: [30, 30]
//         })
//         // User Marker
//         const userIcon = window.L.divIcon({
//             className: 'custom-marker user-marker',
//             html: '<div style="background-color: #22C55E; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">U</div>',
//             iconSize: [30, 30]
//         })

//         window.L.marker([providerProfile.locationLat, providerProfile.locationLng], { icon: providerIcon }).addTo(map)
//             .bindPopup('<b>Provider</b><br>On the way')
//         window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)
//             .bindPopup('<b>You</b><br>Service Location')

//         // Fetch Route
//         try {
//             const response = await fetch(
//                 `https://router.project-osrm.org/route/v1/driving/${providerProfile.locationLng},${providerProfile.locationLat};${userLocation.lng},${userLocation.lat}?overview=full&geometries=geojson`
//             )
//             const data = await response.json()

//             if (data.routes && data.routes.length > 0) {
//                 const route = data.routes[0]
//                 const routeLine = window.L.geoJSON(route.geometry, {
//                     style: { color: '#5B21B6', weight: 4, opacity: 0.7 }
//                 }).addTo(map)

//                 if (route.distance < 1000) {
//                     setDistance(`${Math.round(route.distance)}m`)
//                 } else {
//                     setDistance(`${(route.distance / 1000).toFixed(1)}km`)
//                 }

//                 map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
//             } else {
//                 // Fallback line
//                 const line = window.L.polyline([
//                     [providerProfile.locationLat, providerProfile.locationLng],
//                     [userLocation.lat, userLocation.lng]
//                 ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
//                 map.fitBounds(line.getBounds(), { padding: [50, 50] })
//             }
//         } catch (error) {
//             console.error('Routing error:', error)
//             const line = window.L.polyline([
//                 [providerProfile.locationLat, providerProfile.locationLng],
//                 [userLocation.lat, userLocation.lng]
//             ], { color: '#5B21B6', dashArray: '10, 5' }).addTo(map)
//             map.fitBounds(line.getBounds(), { padding: [50, 50] })
//         }

//         mapInstanceRef.current = map
//     }

//     if (isLoading || !booking) return <TrackingPageSkeleton />

//     return (
//         <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
//                 {/* Left Panel: Details */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
//                     <div className="mb-6">
//                         <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Service</h1>
//                         <div className="flex items-center gap-2">
//                             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
//                             <span className="text-sm font-medium text-green-600">
//                                 {booking.status === 'ACCEPTED' ? 'Provider is on the way' : 'Service in progress'}
//                             </span>
//                         </div>
//                     </div>

//                     <div className="space-y-6 flex-1">
//                         {/* Provider Info */}
//                         <div className="bg-gray-50 rounded-xl p-4">
//                             <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Provider Details</h3>
//                             <div className="flex items-start gap-4 mb-4">
//                                 <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
//                                     <span className="text-primary font-bold text-lg">
//                                         {booking.provider?.name?.charAt(0) || 'P'}
//                                     </span>
//                                 </div>
//                                 <div>
//                                     <p className="font-bold text-gray-900 text-lg">{booking.provider?.name}</p>
//                                     <p className="text-sm text-gray-600">{booking.serviceType}</p>
//                                     <div className="flex items-center gap-1 mt-1">
//                                         <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
//                                         <span className="text-sm font-medium text-gray-700">{providerProfile?.rating || 'New'}</span>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* Actions */}
//                             <div className="flex gap-2">
//                                 <a
//                                     href={`tel:${booking.provider?.phone || ''}`}
//                                     className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${booking.provider?.phone
//                                         ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
//                                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         }`}
//                                 >
//                                     <PhoneIcon size={18} />
//                                     Call Provider
//                                 </a>
//                             </div>
//                         </div>

//                         {/* OTP Section */}
//                         {booking.status === 'ACCEPTED' && (
//                             <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
//                                 <p className="text-sm text-blue-600 font-medium mb-2">Start Job OTP</p>
//                                 <div className="text-3xl font-bold text-blue-800 tracking-widest font-mono">
//                                     {booking.startJobOtp || (
//                                         <span className="text-xl text-blue-400">Waiting for OTP...</span>
//                                     )}
//                                 </div>
//                                 <p className="text-xs text-blue-500 mt-2">
//                                     {booking.startJobOtp
//                                         ? "Share this code with your provider when they arrive to start the service."
//                                         : "OTP will be generated shortly."}
//                                 </p>
//                             </div>
//                         )}

//                         {/* Job Details */}
//                         <div>
//                             <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service Details</h3>
//                             <div className="flex justify-between items-center py-2 border-b border-gray-100">
//                                 <span className="text-gray-600">Booking ID</span>
//                                 <span className="font-medium text-gray-900">#{booking.id}</span>
//                             </div>
//                             <div className="flex justify-between items-center py-2 border-b border-gray-100">
//                                 <span className="text-gray-600">Service Type</span>
//                                 <span className="font-medium text-gray-900">{booking.serviceType}</span>
//                             </div>
//                             <div className="mt-3">
//                                 <p className="text-sm text-gray-500 mb-1">Your Note</p>
//                                 <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
//                                     {booking.note || 'No notes provided'}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="mt-6">
//                         <Button
//                             variant="secondary"
//                             className="w-full"
//                             onClick={() => navigate('/bookings')}
//                         >
//                             Back to Bookings
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Right Panel: Map */}
//                 <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative min-h-[400px]">
//                     {providerProfile?.locationLat && userLocation ? (
//                         <>
//                             <div ref={mapContainerRef} className="absolute inset-0 z-0" />

//                             {/* Overlay Info */}
//                             {distance && (
//                                 <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in fade-in">
//                                     <div className="bg-primary/10 p-2 rounded-lg">
//                                         <NavigationIcon size={20} color="#5B21B6" />
//                                     </div>
//                                     <div>
//                                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Distance away</p>
//                                         <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">{distance}</p>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Legend */}
//                             <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2 text-xs font-medium text-gray-600">
//                                 <div className="flex items-center gap-2">
//                                     <span className="w-3 h-3 rounded-full bg-primary border border-white shadow-sm"></span>
//                                     Provider
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></span>
//                                     You
//                                 </div>
//                             </div>
//                         </>
//                     ) : (
//                         <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
//                             <div className="bg-gray-200 p-4 rounded-full mb-4">
//                                 <MapPinIcon size={40} color="#9CA3AF" />
//                             </div>
//                             <p className="font-medium text-gray-500">Map unavailable</p>
//                             <p className="text-sm mt-1">Waiting for location data from provider...</p>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }


//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }


//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }



//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }



//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }



//   const [isLoading, setIsLoading] = useState(true)
//   const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

//   // Review Modal State
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null)
//   const [rating, setRating] = useState(5)
//   const [comment, setComment] = useState('')

//   /* Auto-refresh on new notification */
//   const { notifications } = useNotifications()
//   // Store the ID of the last processed notification to prevent infinite loops or redundant fetches
//   const [lastProcessedNotificationId, setLastProcessedNotificationId] = useState<number | null>(null)

//   useEffect(() => {
//     if (notifications.length > 0) {
//       const latest = notifications[0]
//       // Check if this is a new notification we haven't processed yet
//       if (latest.id !== lastProcessedNotificationId) {
//         // Check if it's a booking-related notification
//         const isBookingRelated = latest.title.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('booking') ||
//           latest.message.toLowerCase().includes('job') ||
//           latest.title.toLowerCase().includes('request') ||
//           latest.title.toLowerCase().includes('accepted') ||
//           latest.title.toLowerCase().includes('rejected') ||
//           latest.title.toLowerCase().includes('cancelled') ||
//           latest.title.toLowerCase().includes('completed') ||
//           latest.title.toLowerCase().includes('on the way') ||
//           latest.title.toLowerCase().includes('arrived') ||
//           latest.title.toLowerCase().includes('started') ||
//           latest.title.toLowerCase().includes('provider') ||
//           latest.title.toLowerCase().includes('customer');

//         if (isBookingRelated) {
//           console.log('New booking notification received, refreshing list...', latest.id)
//           fetchBookings()
//           setLastProcessedNotificationId(latest.id)
//         }
//       }
//     }
//   }, [notifications])

//   useEffect(() => {
//     fetchBookings()
//   }, [user])

//   const fetchBookings = async () => {
//     if (!user) return

//     try {
//       setIsLoading(true)
//       // Fetch bookings and provider profiles in parallel
//       const [bookingsData, providersData] = await Promise.all([
//         user.role === 'USER'
//           ? bookingService.getBookingsByUser(user.id)
//           : bookingService.getBookingsByProvider(user.id),
//         providerService.getAllProviders()
//       ])

//       setBookings(bookingsData)
//       setProviderProfiles(providersData)
//     } catch (error) {
//       toast.error('Failed to load bookings')
//       console.error('Error fetching bookings:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Get provider profile for a booking
//   const getProviderProfile = (providerId: number): ProviderProfile | undefined => {
//     return providerProfiles.find(p => p.userId === providerId)
//   }

//   // Get price for a booking
//   const getBookingPrice = (booking: Booking): number | null => {
//     const profile = getProviderProfile(booking.provider.id)
//     return profile?.basePrice || null
//   }

//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm('Are you sure you want to cancel this booking?')) return

//     try {
//       await bookingService.cancelBooking(bookingId)
//       toast.success('Booking cancelled successfully')
//       fetchBookings() // Refresh list
//     } catch (error) {
//       console.error('Error cancelling booking:', error)
//       toast.error('Failed to cancel booking')
//     }
//   }

//   const handleBatchCancel = async (bookingIds: number[]) => {
//     if (!window.confirm(`Are you sure you want to cancel all ${bookingIds.length} bookings in this package?`)) return

//     try {
//       await Promise.all(bookingIds.map(id => bookingService.cancelBooking(id)))
//       toast.success('All bookings in package cancelled successfully')
//       fetchBookings()
//     } catch (error) {
//       console.error('Error cancelling package:', error)
//       toast.error('Failed to cancel some bookings in the package')
//     }
//   }

//   const handleSubmitReview = async () => {
//     if (!selectedReviewBooking) return

//     try {
//       await reviewService.createReview({
//         bookingId: selectedReviewBooking.id,
//         rating,
//         comment: comment || undefined,
//       })
//       toast.success('Review submitted successfully!')
//       setIsReviewModalOpen(false)
//       setSelectedReviewBooking(null)
//       setRating(5)
//       setComment('')
//       fetchBookings() // Refresh to show "Review Submitted" state
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to submit review')
//     }
//   }



//   // --- Grouping Logic ---
//   const groupBookings = (list: Booking[]) => {
//     const groups: (Booking | BookingGroup)[] = []
//     const processedIds = new Set<number>()

//     // Sort by recent first
//     const sortedRaw = [...list].sort((a, b) => {
//       const dateA = new Date(a.bookingDate || a.createdAt).getTime()
//       const dateB = new Date(b.bookingDate || b.createdAt).getTime()
//       return dateB - dateA
//     })

//     sortedRaw.forEach(booking => {
//       if (processedIds.has(booking.id)) return

//       // Check if this is a "Multiple Booking Package"
//       // We group by Provider + Service + Note + Status (loosely, or just show header status)
//       // Usually packages have same status, but if split, we might want to split groups.
//       // For simplicity, let's group by Provider + Service + Note.
//       if (booking.note === 'Multiple Booking Package') {
//         const peers = sortedRaw.filter(b =>
//           !processedIds.has(b.id) &&
//           b.provider.id === booking.provider.id &&
//           b.serviceType === booking.serviceType &&
//           b.note === 'Multiple Booking Package'
//           // Not filtering by status strictly to keep package together? 
//           // Or should we only group same-status items? 
//           // Let's group same-status to avoid confusion (e.g. 3 accepted, 2 rejected).
//           && b.status === booking.status
//         )

//         if (peers.length > 1) {
//           const dates = peers
//             .map(b => new Date(b.bookingDate || ''))
//             .filter(d => !isNaN(d.getTime()))

//           const group: BookingGroup = {
//             id: `group-${peers[0].id}`,
//             isGroup: true,
//             bookings: peers,
//             provider: booking.provider,
//             serviceType: booking.serviceType,
//             note: booking.note,
//             earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
//             latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
//             status: booking.status
//           }
//           groups.push(group)
//           peers.forEach(p => processedIds.add(p.id))
//           return
//         }
//       }

//       groups.push(booking)
//       processedIds.add(booking.id)
//     })

//     return groups
//   }


//   // Separate upcoming and past bookings
//   // Upcoming: REQUESTED or ACCEPTED status
//   const upcomingRaw = bookings.filter(
//     (b) => b.status === 'REQUESTED' || b.status === 'ACCEPTED'
//   )
//   const upcomingBookings = groupBookings(upcomingRaw)


//   // Past: COMPLETED, CANCELLED, or REJECTED status
//   const pastRaw = bookings.filter(
//     (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
//   )
//   const pastBookings = groupBookings(pastRaw)

//   // Filter Logic for "All/Upcoming/Completed/Cancelled" tabs
//   const getFilteredList = () => {
//     let raw: Booking[] = []
//     switch (activeFilter) {
//       case 'upcoming':
//         raw = bookings.filter(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED')
//         break
//       case 'completed':
//         raw = bookings.filter(b => b.status === 'COMPLETED')
//         break
//       case 'cancelled':
//         raw = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED')
//         break
//       case 'all':
//       default:
//         return [...upcomingBookings, ...pastBookings] // Already grouped
//     }
//     return groupBookings(raw)
//   }

//   const filteredBookings = activeFilter === 'all' ? [...upcomingBookings, ...pastBookings] : getFilteredList()


//   if (isLoading) {
//     return <BookingsSkeleton />
//   }

//   // Render Helper
//   const renderBookingCard = (item: Booking | BookingGroup, isUpcoming: boolean) => {
//     const isGroup = (item as BookingGroup).isGroup
//     const booking = isGroup ? (item as BookingGroup).bookings[0] : (item as Booking)
//     const group = isGroup ? (item as BookingGroup) : null

//     const serviceInfo = getServiceInfo(booking.serviceType)
//     const ServiceIcon = serviceInfo.icon
//     const statusInfo = STATUS_CONFIG[booking.status] // Use group status or single status

//     const price = isGroup ?
//       (getBookingPrice(booking) ? getBookingPrice(booking)! * group!.bookings.length : null) :
//       getBookingPrice(booking)

//     return (
//       <Card key={isGroup ? group!.id : booking.id} className="overflow-hidden mb-4">
//         <CardContent className="p-4 md:p-5">
//           <div className="flex flex-col md:flex-row gap-4 md:gap-5">
//             {/* Left Section - Service Details */}
//             <div className="flex-1">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
//                   style={{ backgroundColor: `${serviceInfo.color}15` }}
//                 >
//                   <ServiceIcon size={24} color={serviceInfo.color} />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1 flex-wrap">
//                     <h3 className="text-card-title font-medium text-text-primary">
//                       {serviceInfo.label}
//                     </h3>
//                     {isGroup && (
//                       <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
//                         Package ({group!.bookings.length})
//                       </span>
//                     )}
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     {isGroup ? `Package ID: ${group!.id}` : `Booking #${formatBookingId(booking.id)}`}
//                   </p>
//                   <div className="space-y-2">
//                     {/* Date Display */}
//                     {isGroup ? (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary">
//                         <CalendarIcon size={16} color="#6B7280" />
//                         <span>
//                           {group!.earliestDate && group!.latestDate
//                             ? `${format(group!.earliestDate, 'MMM d')} - ${format(group!.latestDate, 'MMM d, yyyy')}`
//                             : 'Dates Pending'}
//                         </span>
//                       </div>
//                     ) : (
//                       (() => {
//                         const serviceDate = getBookingServiceDate(booking)
//                         const formattedDate = formatBookingDate(serviceDate instanceof Date ? serviceDate.toISOString() : serviceDate)
//                         return formattedDate && (
//                           <div className="flex items-center gap-2 text-sm text-text-secondary">
//                             <CalendarIcon size={16} color="#6B7280" />
//                             <span>{formattedDate}</span>
//                           </div>
//                         )
//                       })()
//                     )}

//                     <div className="flex items-center gap-2 text-sm text-text-secondary">
//                       <UserIcon size={16} color="#6B7280" />
//                       <span className="truncate">
//                         {booking.provider?.name || (isGroup ? group!.provider?.name : 'Assigning provider...')}
//                       </span>
//                     </div>
//                     {/* OTP Display for User - Only visible to Customers */}
//                     {user?.role === 'USER' && (
//                       isGroup ? (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {group!.bookings.map(b => (
//                             (b.status === 'ACCEPTED' && b.startJobOtp) && (
//                               <div key={b.id} className="text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col min-w-[120px]">
//                                 <span className="text-xs text-blue-600 mb-1 font-medium">
//                                   {b.bookingDate ? format(parseISO(b.bookingDate.toString()), 'MMM d') : 'Date TBD'}
//                                 </span>
//                                 <span className="font-bold text-blue-800 tracking-wide">OTP: {b.startJobOtp}</span>
//                               </div>
//                             )
//                           ))}
//                         </div>
//                       ) : (
//                         booking.status === 'ACCEPTED' && booking.startJobOtp && (
//                           <div className="mt-2 text-sm text-text-dark bg-blue-50 border border-blue-100 p-2 rounded-lg inline-block w-full md:w-auto">
//                             <span className="font-semibold text-blue-800 block md:inline">Start OTP: {booking.startJobOtp}</span>
//                             <span className="block text-xs text-blue-600 mt-1 md:inline md:ml-2">Share with provider on arrival</span>
//                           </div>
//                         )
//                       )
//                     )}
//                     {(booking.note || isGroup) && (
//                       <div className="flex items-center gap-2 text-sm text-text-secondary mt-2 bg-gray-50 p-2 rounded w-full">
//                         <span className="text-xs break-words line-clamp-2">Note: {booking.note || 'Multiple Booking Package'}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Middle Section - Time & Cost */}
//             <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 md:gap-1 border-t border-b md:border-0 border-slate-50 py-3 md:py-1 md:min-w-[140px]">
//               <div className="flex items-center gap-2 text-sm text-text-secondary mb-0 md:mb-3">
//                 <ClockIcon size={16} color="#6B7280" />
//                 <span>{isGroup ? 'Daily Service' : formatBookingTime(booking)}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
//                 <DollarSignIcon size={16} color="#111827" />
//                 <span>
//                   {price
//                     ? `$${price}`
//                     : (booking.status === 'REQUESTED' ? 'Price TBD' : 'N/A')}
//                 </span>
//               </div>
//             </div>

//             {/* Right Section - Status & Actions */}
//             <div className="flex flex-col justify-center gap-3 md:min-w-[180px] md:border-l border-slate-100 md:pl-6">
//               {/* Status Badge - Hidden on mobile as it often duplicates info, or we can keep it at top right if absolutely needed. 
//                   Actually, let's keep it but position it better. 
//                   In this new layout, we might want it at the top of the card or just here.
//                   Let's keep it here but align appropriately.
//               */}
//               <div className="flex justify-between md:justify-end mb-1">
//                 <span className="md:hidden text-sm font-medium text-text-muted">Status</span>
//                 <div className="flex flex-col items-end gap-1">
//                   <div
//                     className="px-3 py-1 rounded-full text-xs font-medium"
//                     style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
//                   >
//                     {booking.status === 'REJECTED' && booking.note?.includes('Auto-rejected') ? 'Expired' : statusInfo.label}
//                   </div>
//                   {booking.status === 'REQUESTED' && (
//                     <span className="text-xs text-gray-400">Pending</span>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
//                 {/* Actions - Simplified for Group */}

//                 {/* Track Service Button for Users */}
//                 {!isGroup && user?.role === 'USER' && (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && (
//                   <button
//                     onClick={() => window.location.href = `/track-service/${booking.id}`}
//                     className="w-full py-2.5 px-4 rounded-xl bg-white border border-green-500 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2 mb-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">location_on</span>
//                     Track Service
//                   </button>
//                 )}

//                 {/* Cancel & Reschedule Buttons */}
//                 {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => isGroup
//                         ? handleBatchCancel(group!.bookings.map(b => b.id))
//                         : handleCancelBooking(booking.id)
//                       }
//                       className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <span className="material-symbols-outlined text-lg">cancel</span>
//                       Cancel {isGroup ? 'Package' : ''}
//                     </button>
//                   </div>
//                 )}
//                 {(booking.status === 'ACCEPTED' || booking.status === 'COMPLETED') && (
//                   <button
//                     onClick={() => {
//                       let targetId: number
//                       let targetName: string

//                       if (user?.role === 'PROVIDER') {
//                         targetId = booking.user.id
//                         targetName = booking.user.name
//                       } else {
//                         targetId = isGroup ? group!.provider.id : booking.provider.id
//                         targetName = isGroup ? group!.provider.name : booking.provider.name
//                       }

//                       openChat(targetId, targetName)
//                     }}
//                     className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-text-muted font-medium text-sm hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
//                   >
//                     <span className="material-symbols-outlined text-lg">chat</span>
//                     {user?.role === 'PROVIDER' ? 'Message Customer' : 'Message Provider'}
//                   </button>
//                 )}

//                 {booking.status === 'COMPLETED' && (
//                   booking.reviewId ? (
//                     <button
//                       disabled
//                       className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed"
//                     >
//                       <span className="material-symbols-outlined text-lg">check_circle</span>
//                       Review Submitted
//                     </button>
//                   ) : (
//                     user?.role === 'USER' && (
//                       <button
//                         onClick={() => {
//                           setSelectedReviewBooking(booking)
//                           setIsReviewModalOpen(true)
//                         }}
//                         className="w-full py-2.5 px-4 rounded-xl bg-white border border-yellow-400 text-yellow-600 font-medium text-sm hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
//                       >
//                         <span className="material-symbols-outlined text-lg">star</span>
//                         Write Review
//                       </button>
//                     )
//                   )
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Render bookings for both USER and PROVIDER roles
//   return (
//     <div className="mx-auto max-w-6xl flex flex-col gap-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight">Booking History</h1>
//           <p className="text-sm font-medium text-text-muted mt-1">Manage and track your service appointments</p>
//         </div>

//         <div className="flex gap-2 bg-card rounded-lg p-1 border border-slate-200">
//           {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map((filter) => (
//             <button
//               key={filter}
//               onClick={() => setActiveFilter(filter)}
//               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter
//                 ? 'bg-primary text-white shadow-sm'
//                 : 'text-text-muted hover:bg-surface'
//                 }`}
//             >
//               {filter.charAt(0).toUpperCase() + filter.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content based on filter */}
//       {activeFilter === 'all' ? (
//         <>
//           {/* Upcoming Appointments Section */}
//           {upcomingBookings.length > 0 && (
//             <div className="space-y-4">
//               <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
//                 <span className="material-symbols-outlined text-accent-orange">schedule</span>
//                 Upcoming Appointments
//               </h2>
//               <div className="space-y-4">
//                 {upcomingBookings.map((booking) => renderBookingCard(booking, true))}
//               </div>
//             </div>
//           )}

//           {/* Past History Section */}
//           {pastBookings.length > 0 && (
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <HistoryIcon size={20} color="#6B7280" />
//                 <h2 className="text-lg font-bold text-text-dark flex items-center gap-2 mt-8 mb-4">
//                   <span className="material-symbols-outlined text-text-muted">history</span>
//                   Past History
//                 </h2>
//               </div>
//               <div className="space-y-3">
//                 {pastBookings.map((booking) => renderBookingCard(booking, false))}
//               </div>
//             </div>
//           )}
//         </>
//       ) : (
//         // Filtered view
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//               <div className="p-12 text-center">
//                 <p className="text-body text-text-secondary">No {activeFilter} bookings found</p>
//               </div>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => renderBookingCard(booking, activeFilter === 'upcoming'))
//           )}
//         </div>
//       )}

//       {upcomingBookings.length === 0 && pastBookings.length === 0 && (
//         <div className="bg-card rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="p-12 text-center">
//             <p className="text-body text-text-secondary">No bookings found</p>
//           </div>
//         </div>
//       )}


//       <Modal
//         isOpen={isReviewModalOpen}
//         onClose={() => {
//           setIsReviewModalOpen(false)
//           setSelectedReviewBooking(null)
//           setRating(5)
//           setComment('')
//         }}
//         title="Write a Review"
//       >
//         {selectedReviewBooking && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Rating</p>
//               <div className="flex gap-2">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                   <button
//                     key={star}
//                     type="button"
//                     onClick={() => setRating(star)}
//                     className="focus:outline-none"
//                   >
//                     <StarIcon
//                       size={32}
//                       color={star <= rating ? '#FCD34D' : '#D1D5DB'}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <Textarea
//               label="Comment (Optional)"
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               placeholder="Share your experience..."
//               rows={4}
//             />
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => {
//                   setIsReviewModalOpen(false)
//                   setSelectedReviewBooking(null)
//                   setRating(5)
//                   setComment('')
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button className="flex-1" onClick={handleSubmitReview}>
//                 Submit Review
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div >
//   )
// }

// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { Textarea } from '../components/ui/Textarea'
// import { Select } from '../components/ui/Select'
// import { providerService } from '../services/providerService'
// import toast from 'react-hot-toast'
// import type { ServiceType } from '../types'

// const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
//   { value: 'PLUMBER', label: 'Plumber' },
//   { value: 'ELECTRICIAN', label: 'Electrician' },
//   { value: 'CLEANER', label: 'Cleaner' },
//   { value: 'LAUNDRY', label: 'Laundry' },
//   { value: 'OTHER', label: 'Other' },
// ]

// export const CreateProviderProfile = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     serviceType: '' as ServiceType | '',
//     description: '',
//     basePrice: '',
//     locationLat: '',
//     locationLng: '',
//   })
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [isLoading, setIsLoading] = useState(false)

//   const validate = () => {
//     const newErrors: Record<string, string> = {}
//     if (!formData.serviceType) {
//       newErrors.serviceType = 'Service type is required'
//     }
//     if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
//       newErrors.locationLat = 'Valid latitude is required'
//     }
//     if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
//       newErrors.locationLng = 'Valid longitude is required'
//     }
//     if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
//       newErrors.basePrice = 'Base price must be a number'
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!validate() || !user) return

//     setIsLoading(true)
//     try {
//       await providerService.createProfile(user.id, {
//         serviceType: formData.serviceType as ServiceType,
//         description: formData.description || undefined,
//         basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
//         locationLat: parseFloat(formData.locationLat),
//         locationLng: parseFloat(formData.locationLng),
//       })
//       toast.success('Provider profile created successfully!')
//       // Redirect to profile completion page after successful profile creation
//       navigate('/complete-provider-profile')
//     } catch (error: any) {
//       console.error('Error creating provider profile:', error)
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
//       toast.error(errorMessage)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!user || user.role !== 'PROVIDER') {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <p className="text-gray-500">Only providers can create profiles</p>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
//       <Card>
//         <CardHeader>
//           <CardTitle>Provider Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Select
//               label="Service Type"
//               value={formData.serviceType}
//               onChange={(e) =>
//                 setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
//               }
//               error={errors.serviceType}
//               options={[
//                 { value: '', label: 'Select a service type' },
//                 ...SERVICE_TYPES,
//               ]}
//             />
//             <Textarea
//               label="Description (Optional)"
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               placeholder="Describe your services..."
//               rows={4}
//             />
//             <Input
//               label="Base Price (Optional)"
//               type="number"
//               value={formData.basePrice}
//               onChange={(e) =>
//                 setFormData({ ...formData, basePrice: e.target.value })
//               }
//               error={errors.basePrice}
//               placeholder="100"
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Latitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLat}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLat: e.target.value })
//                 }
//                 error={errors.locationLat}
//                 placeholder="40.7128"
//               />
//               <Input
//                 label="Longitude"
//                 type="number"
//                 step="any"
//                 value={formData.locationLng}
//                 onChange={(e) =>
//                   setFormData({ ...formData, locationLng: e.target.value })
//                 }
//                 error={errors.locationLng}
//                 placeholder="-74.0060"
//               />
//             </div>
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="flex-1"
//                 onClick={() => navigate('/dashboard')}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="flex-1"
//                 isLoading={isLoading}
//                 disabled={isLoading}
//               >
//                 Create Profile
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useNotifications } from '../contexts/NotificationContext'
// import { DashboardSkeleton } from '../components/ui/Loader'
// import { bookingService } from '../services/bookingService'
// import type { Booking } from '../types'
// import { isToday } from 'date-fns'
// import { ProviderDashboard } from './ProviderDashboard'


// const getGreeting = () => {
//   const hour = new Date().getHours()
//   if (hour < 12) return 'Good Morning'
//   if (hour < 17) return 'Good Afternoon'
//   return 'Good Evening'
// }

// type TrackingStatus = 'on_the_way' | 'reached' | 'arrived'

// export const Dashboard = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
//   const [trackingStatus] = useState<TrackingStatus>('on_the_way')

//   // Redirect admins to the admin dashboard
//   useEffect(() => {
//     if (user?.role === 'ADMIN') {
//       navigate('/admin', { replace: true })
//     }
//   }, [user?.role, navigate])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!user) return

//       try {
//         if (user.role === 'USER') {
//           const bookings = await bookingService.getBookingsByUser(user.id)

//           // Find active booking (ACCEPTED or IN_PROGRESS status)
//           // Prioritize IN_PROGRESS, then check for ACCEPTED bookings that are for TODAY
//           const active = bookings.find(b =>
//             b.status === 'IN_PROGRESS' ||
//             (b.status === 'ACCEPTED' && isToday(new Date(b.bookingDate || b.createdAt)))
//           )
//           setActiveBooking(active || null)
//         }
//       } catch (error) {
//         console.error('Failed to fetch data:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }
