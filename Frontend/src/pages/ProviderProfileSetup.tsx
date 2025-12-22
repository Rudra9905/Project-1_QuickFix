import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { providerService } from '../services/providerService'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { MapPinIcon, CheckIcon, UploadIcon } from '../components/icons/CustomIcons'
import toast from 'react-hot-toast'
import type { ServiceType, ProviderProfile } from '../types'

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
    { value: 'PLUMBER', label: 'Plumber' },
    { value: 'ELECTRICIAN', label: 'Electrician' },
    { value: 'CLEANER', label: 'Cleaner' },
    { value: 'LAUNDRY', label: 'Laundry' },
    { value: 'OTHER', label: 'Other' },
]

export const ProviderProfileSetup = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<ProviderProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [detectingLocation, setDetectingLocation] = useState(false)

    const [formData, setFormData] = useState({
        serviceType: '' as ServiceType | '',
        description: '',
        experienceYears: '',
        basePrice: '',
        locationLat: '',
        locationLng: '',
        detectedAddress: '',
    })

    const [fileData, setFileData] = useState({
        resume: null as File | null,
        demoVideo: null as File | null,
    })

    const [filePreview, setFilePreview] = useState({
        resume: null as string | null,
        demoVideo: null as string | null,
    })

    const [portfolioImages, setPortfolioImages] = useState<{ id: number; url: string }[]>([])

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [step, setStep] = useState(1) // 1: Info, 2: Location, 3: Documents

    useEffect(() => {
        fetchProviderProfile()
    }, [user?.id])

    const fetchProviderProfile = async () => {
        if (!user) return

        try {
            setLoading(true)
            const providerProfile = await providerService.getProviderByUserId(user.id)

            if (providerProfile) {
                setProfile(providerProfile)
                setFormData({
                    serviceType: providerProfile.serviceType || '',
                    description: providerProfile.description || '',
                    experienceYears: providerProfile.experienceYears?.toString() || '',
                    basePrice: providerProfile.basePrice?.toString() || '',
                    locationLat: providerProfile.locationLat?.toString() || '',
                    locationLng: providerProfile.locationLng?.toString() || '',
                    detectedAddress: '',
                })

                if (providerProfile.resumeUrl) {
                    setFilePreview(prev => ({ ...prev, resume: providerProfile.resumeUrl || null }))
                }
                if (providerProfile.demoVideoUrl) {
                    setFilePreview(prev => ({ ...prev, demoVideo: providerProfile.demoVideoUrl || null }))
                }

                // Load portfolio images
                if (providerProfile.portfolioImages && providerProfile.portfolioImages.length > 0) {
                    const imagesWithIds = providerProfile.portfolioImages.map((url, index) => ({
                        id: index + 1,
                        url: `http://localhost:3000${url}`
                    }))
                    setPortfolioImages(imagesWithIds)
                }
            }
        } catch (error) {
            console.error('Failed to fetch provider profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            return
        }

        setDetectingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setFormData(prev => ({
                    ...prev,
                    locationLat: latitude.toString(),
                    locationLng: longitude.toString(),
                }))

                // Try to get address from coordinates (reverse geocoding)
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    )
                    const data = await response.json()
                    const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    setFormData(prev => ({ ...prev, detectedAddress: address }))
                    toast.success('Location detected successfully!')
                } catch (error) {
                    setFormData(prev => ({
                        ...prev,
                        detectedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    }))
                    toast.success('Location coordinates captured!')
                }
                setDetectingLocation(false)
            },
            (error) => {
                console.error('Geolocation error:', error)
                toast.error('Failed to detect location. Please enable location services.')
                setDetectingLocation(false)
            }
        )
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.serviceType) {
            newErrors.serviceType = 'Service type is required'
        }

        if (!formData.description || formData.description.length < 20) {
            newErrors.description = 'Description must be at least 20 characters'
        }

        if (!formData.experienceYears || isNaN(parseInt(formData.experienceYears)) || parseInt(formData.experienceYears) < 0) {
            newErrors.experienceYears = 'Valid experience years is required'
        }

        if (formData.basePrice && (isNaN(parseInt(formData.basePrice)) || parseInt(formData.basePrice) < 0)) {
            newErrors.basePrice = 'Base price must be a positive number'
        }

        if (!formData.locationLat || !formData.locationLng) {
            newErrors.location = 'Please detect your location'
        }

        if (!filePreview.resume && !profile?.resumeUrl) {
            newErrors.resume = 'Resume is required'
        }

        if (!filePreview.demoVideo && !profile?.demoVideoUrl) {
            newErrors.demoVideo = 'Demo video is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'demoVideo') => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]

        // Validate file size
        const maxSize = fileType === 'resume' ? 5 * 1024 * 1024 : 50 * 1024 * 1024 // 5MB for resume, 50MB for video
        if (file.size > maxSize) {
            toast.error(`File size must be less than ${fileType === 'resume' ? '5MB' : '50MB'}`)
            return
        }

        setFileData(prev => ({ ...prev, [fileType]: file }))
        setFilePreview(prev => ({ ...prev, [fileType]: URL.createObjectURL(file) }))
    }

    const handleSubmit = async () => {
        if (!validate() || !user) return

        setSaving(true)
        try {
            let currentProfile = profile

            // Step 1: Create or update profile
            if (!currentProfile) {
                currentProfile = await providerService.createProfile(user.id, {
                    serviceType: formData.serviceType as ServiceType,
                    description: formData.description,
                    basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
                    locationLat: parseFloat(formData.locationLat),
                    locationLng: parseFloat(formData.locationLng),
                })
                setProfile(currentProfile)
            } else {
                currentProfile = await providerService.updateProfile(currentProfile.id, {
                    serviceType: formData.serviceType as ServiceType,
                    description: formData.description,
                    experienceYears: parseInt(formData.experienceYears),
                    basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
                    locationLat: parseFloat(formData.locationLat),
                    locationLng: parseFloat(formData.locationLng),
                })
            }

            // Step 2: Upload resume if new file selected
            if (fileData.resume) {
                currentProfile = await providerService.uploadResume(currentProfile.id, fileData.resume)
            }

            // Step 3: Upload demo video if new file selected
            if (fileData.demoVideo) {
                currentProfile = await providerService.uploadDemoVideo(currentProfile.id, fileData.demoVideo)
            }

            // Step 4: Submit for review
            await providerService.submitForReview(currentProfile.id)

            toast.success('Profile submitted for review successfully!')
            navigate('/dashboard')
        } catch (error: any) {
            console.error('Error submitting profile:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit profile'
            toast.error(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader size="lg" />
            </div>
        )
    }

    if (!user || user.role !== 'PROVIDER') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-text-secondary">Only providers can access this page</p>
            </div>
        )
    }

    // Check if already approved
    if (profile?.profileStatus === 'APPROVED') {
        navigate('/dashboard')
        return null
    }

    const isUnderReview = profile?.profileStatus === 'PENDING_APPROVAL'

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Profile Setup</h1>
                <p className="text-gray-600">
                    Complete your professional profile to start receiving bookings
                </p>
            </div>

            {isUnderReview && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckIcon size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900">Profile Under Review</h3>
                            <p className="text-blue-700">Your profile is being reviewed by our admin team. You'll be notified once approved.</p>
                        </div>
                    </div>
                </div>
            )}

            {profile?.profileStatus === 'REJECTED' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Profile Rejected</h3>
                    {profile.rejectionReason && (
                        <p className="text-red-700 mb-3">Reason: {profile.rejectionReason}</p>
                    )}
                    <p className="text-red-600">Please update your information and resubmit.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Service Information</h2>

                            <div className="space-y-5">
                                <Select
                                    label="Service Type *"
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })}
                                    error={errors.serviceType}
                                    options={[
                                        { value: '', label: 'Select a service type' },
                                        ...SERVICE_TYPES,
                                    ]}
                                    disabled={isUnderReview}
                                />

                                <Textarea
                                    label="Description *"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    error={errors.description}
                                    placeholder="Describe your services, expertise, and what makes you stand out..."
                                    rows={5}
                                    disabled={isUnderReview}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Experience (years) *"
                                        type="number"
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                                        error={errors.experienceYears}
                                        placeholder="5"
                                        disabled={isUnderReview}
                                    />

                                    <Input
                                        label="Base Price (₹)"
                                        type="number"
                                        value={formData.basePrice}
                                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                        error={errors.basePrice}
                                        placeholder="500"
                                        disabled={isUnderReview}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>

                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    onClick={handleDetectLocation}
                                    isLoading={detectingLocation}
                                    disabled={detectingLocation || isUnderReview}
                                    className="w-full"
                                >
                                    <MapPinIcon size={20} color="white" className="mr-2" />
                                    {detectingLocation ? 'Detecting...' : 'Detect My Location'}
                                </Button>

                                {formData.detectedAddress && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <p className="text-sm text-green-700 font-medium mb-1">Location Detected:</p>
                                        <p className="text-green-900 flex items-start gap-2">
                                            <MapPinIcon size={16} color="#059669" className="mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{formData.detectedAddress}</span>
                                        </p>
                                        <p className="text-xs text-green-600 mt-2">
                                            Coordinates: {parseFloat(formData.locationLat).toFixed(4)}, {parseFloat(formData.locationLng).toFixed(4)}
                                        </p>
                                    </div>
                                )}

                                {errors.location && (
                                    <p className="text-red-600 text-sm">{errors.location}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>

                            <div className="space-y-6">
                                {/* Resume Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Resume (PDF) *
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                                        {filePreview.resume ? (
                                            <div className="space-y-3">
                                                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                                                    <CheckIcon size={32} color="#059669" />
                                                </div>
                                                <p className="text-sm text-green-700 font-medium">Resume uploaded</p>
                                                <a
                                                    href={filePreview.resume}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    View Resume
                                                </a>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadIcon size={40} color="#9CA3AF" className="mx-auto mb-3" />
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => handleFileChange(e, 'resume')}
                                                    disabled={isUnderReview}
                                                    className="hidden"
                                                    id="resume-upload"
                                                />
                                                <label
                                                    htmlFor="resume-upload"
                                                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Click to upload PDF
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                                            </>
                                        )}
                                    </div>
                                    {errors.resume && <p className="text-red-600 text-sm mt-2">{errors.resume}</p>}
                                </div>

                                {/* Demo Video Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Demo Video (MP4) *
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                                        {filePreview.demoVideo ? (
                                            <div className="space-y-3">
                                                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                                                    <CheckIcon size={32} color="#059669" />
                                                </div>
                                                <p className="text-sm text-green-700 font-medium">Demo video uploaded</p>
                                                <a
                                                    href={filePreview.demoVideo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    View Video
                                                </a>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadIcon size={40} color="#9CA3AF" className="mx-auto mb-3" />
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/quicktime"
                                                    onChange={(e) => handleFileChange(e, 'demoVideo')}
                                                    disabled={isUnderReview}
                                                    className="hidden"
                                                    id="video-upload"
                                                />
                                                <label
                                                    htmlFor="video-upload"
                                                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Click to upload MP4
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">Max size: 50MB</p>
                                            </>
                                        )}
                                    </div>
                                    {errors.demoVideo && <p className="text-red-600 text-sm mt-2">{errors.demoVideo}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h3>
                            <ul className="space-y-3 text-sm">
                                {[
                                    'Service type & description',
                                    'Years of experience',
                                    'Base service price',
                                    'Your location',
                                    'Resume (PDF format)',
                                    'Demo video (MP4 format)',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckIcon size={16} color="#10B981" className="mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {!isUnderReview && (
                        <Button
                            onClick={handleSubmit}
                            isLoading={saving}
                            disabled={saving}
                            className="w-full"
                        >
                            {saving ? 'Submitting...' : 'Submit for Review'}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="w-full"
                    >
                        {isUnderReview ? 'Back to Dashboard' : 'Cancel'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
