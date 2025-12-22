import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Textarea } from './ui/Textarea'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import type { ProviderProfile, ServiceOffering } from '../types'
import toast from 'react-hot-toast'
import {
    StarIcon,
    DollarSignIcon,
    MapPinIcon,
    ClockIcon,
    CheckIcon,
    UserIcon,
} from './icons/CustomIcons'

interface ProviderDetailModalProps {
    isOpen: boolean
    onClose: () => void
    provider: ProviderProfile | null
    userId?: number
    userRole?: string
}

const SERVICE_TYPES: Record<string, string> = {
    PLUMBER: 'Plumber',
    ELECTRICIAN: 'Electrician',
    CLEANER: 'Cleaner',
    LAUNDRY: 'Laundry',
    OTHER: 'Other',
}

export const ProviderDetailModal = ({
    isOpen,
    onClose,
    provider,
    userId,
    userRole,
}: ProviderDetailModalProps) => {
    const [bookingNote, setBookingNote] = useState('')
    const [isBooking, setIsBooking] = useState(false)
    const [selectedImage, setSelectedImage] = useState(0)
    const [serviceOfferings, setServiceOfferings] = useState<ServiceOffering[]>([])
    const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null)
    const [isLoadingServices, setIsLoadingServices] = useState(false)

    // Fetch service offerings when modal opens
    useEffect(() => {
        if (isOpen && provider) {
            fetchServiceOfferings()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, provider?.id])

    const fetchServiceOfferings = async () => {
        if (!provider) return

        setIsLoadingServices(true)
        try {
            const services = await providerService.listServices(provider.id)
            const activeServices = services.filter(s => s.active)
            setServiceOfferings(activeServices)
            // Auto-select first service if only one available
            if (activeServices.length === 1) {
                setSelectedService(activeServices[0])
            }
        } catch (error) {
            console.error('Error fetching services:', error)
            toast.error('Failed to load services')
        } finally {
            setIsLoadingServices(false)
        }
    }

    const handleBookService = async () => {
        if (!userId || userRole !== 'USER') {
            toast.error('Please login as a user to book services')
            return
        }

        if (!provider || !provider.isAvailable) {
            toast.error('This provider is currently offline')
            return
        }

        // If services exist but none selected, require selection
        if (serviceOfferings.length > 0 && !selectedService) {
            toast.error('Please select a service')
            return
        }

        setIsBooking(true)
        try {
            // Build note with pricing info
            let bookingNoteText = bookingNote
            if (selectedService) {
                // Booking with selected service price
                bookingNoteText = bookingNote
                    ? `${selectedService.name} - ₹${selectedService.price}/${selectedService.unit}\n${bookingNote}`
                    : `${selectedService.name} - ₹${selectedService.price}/${selectedService.unit}`
            } else if (provider.basePrice) {
                // Booking at base price (no service menu)
                bookingNoteText = bookingNote
                    ? `Base Service - ₹${provider.basePrice}\n${bookingNote}`
                    : `Base Service - ₹${provider.basePrice}`
            }

            await bookingService.createBooking(userId, {
                providerId: provider.userId,
                serviceType: provider.serviceType,
                note: bookingNoteText,
            })
            toast.success('Booking request sent successfully!')
            setBookingNote('')
            setSelectedService(null)
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create booking')
        } finally {
            setIsBooking(false)
        }
    }

    // Early return after all hooks
    if (!provider) return null

    const portfolioImages = provider.portfolioImages || []
    const hasPortfolio = portfolioImages.length > 0

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
            <div className="space-y-6">
                {/* Portfolio Gallery */}
                {hasPortfolio && (
                    <div className="space-y-3">
                        {/* Main Image */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={portfolioImages[selectedImage]}
                                alt={`${provider.user?.name || 'Provider'}'s work`}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Thumbnail Gallery */}
                        {portfolioImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {portfolioImages.map((image, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                            ? 'border-blue-600 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Provider Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {provider.user?.name || 'Provider'}
                            </h2>
                            <Badge variant={provider.isAvailable ? 'success' : 'default'}>
                                {provider.isAvailable ? 'Available Now' : 'Busy'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <UserIcon size={16} />
                                {SERVICE_TYPES[provider.serviceType] || provider.serviceType}
                            </span>
                            {provider.experienceYears && (
                                <span className="flex items-center gap-1">
                                    <ClockIcon size={16} />
                                    {provider.experienceYears} years experience
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <MapPinIcon size={16} />
                                {provider.user?.city || 'Location not set'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                            <StarIcon size={20} color="#FCD34D" />
                            <span className="text-lg font-bold text-gray-900">
                                {provider.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500">/5.0</span>
                        </div>
                        {provider.basePrice && (
                            <div className="flex items-center gap-1 text-blue-600">
                                <DollarSignIcon size={18} />
                                <span className="text-xl font-bold">₹{provider.basePrice}</span>
                                <span className="text-sm">base</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {provider.description && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                        <p className="text-gray-600 leading-relaxed">{provider.description}</p>
                    </div>
                )}

                {/* Services & Credentials */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Service Menu */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Service Menu</h3>
                        {isLoadingServices ? (
                            <div className="text-sm text-gray-500">Loading services...</div>
                        ) : serviceOfferings.length > 0 ? (
                            <div className="space-y-2">
                                {serviceOfferings.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedService?.id === service.id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{service.name}</div>
                                                {service.description && (
                                                    <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                                                )}
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="font-bold text-blue-600">₹{service.price}</div>
                                                <div className="text-xs text-gray-500">/{service.unit}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">No services available</div>
                        )}
                    </div>

                    {/* Credentials */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Credentials</h3>
                        <div className="space-y-2">
                            {provider.resumeUrl && (
                                <a
                                    href={provider.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                    <CheckIcon size={16} color="#3B82F6" />
                                    <span>View Resume</span>
                                </a>
                            )}
                            {provider.demoVideoUrl && (
                                <a
                                    href={provider.demoVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                    <CheckIcon size={16} color="#3B82F6" />
                                    <span>Watch Demo Video</span>
                                </a>
                            )}
                            {provider.isApproved && (
                                <div className="flex items-center gap-2 text-sm text-green-700">
                                    <CheckIcon size={16} color="#10B981" />
                                    <span>Verified Provider</span>
                                </div>
                            )}
                            {provider.experienceYears && provider.experienceYears > 3 && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckIcon size={16} color="#6B7280" />
                                    <span>Experienced Professional</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Section */}
                {userRole === 'USER' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Book This Provider</h3>

                        {/* Selected Service Summary */}
                        {selectedService && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900">{selectedService.name}</div>
                                        <div className="text-sm text-gray-600">{selectedService.description}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">₹{selectedService.price}</div>
                                        <div className="text-sm text-gray-600">per {selectedService.unit}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Textarea
                            label="Additional Notes (Optional)"
                            value={bookingNote}
                            onChange={(e) => setBookingNote(e.target.value)}
                            placeholder="Any special requirements or details about the job..."
                            rows={3}
                        />
                        <div className="flex gap-3 mt-4">
                            <Button variant="outline" className="flex-1" onClick={onClose}>
                                Close
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleBookService}
                                disabled={!provider.isAvailable || isBooking || (serviceOfferings.length > 0 && !selectedService)}
                                isLoading={isBooking}
                            >
                                {!provider.isAvailable
                                    ? 'Provider Offline'
                                    : serviceOfferings.length > 0 && !selectedService
                                        ? 'Select a Service'
                                        : selectedService
                                            ? `Book ${selectedService.name} - ₹${selectedService.price}`
                                            : `Book Service - ₹${provider.basePrice || 'TBD'}`}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
