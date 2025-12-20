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
        <div className="min-h-screen bg-gradient-to-br from-[#F7F7FB] to-[#EDE9FE]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5B21B6] via-[#6366F1] to-[#7C3AED] text-white py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <h1 className="text-4xl font-bold mb-3">Provider Profile Setup</h1>
                    <p className="text-white/90 text-lg">Complete your professional profile to start receiving bookings</p>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mt-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s ? 'bg-white text-[#5B21B6]' : 'bg-white/20 text-white/60'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 mx-2 transition-all ${step > s ? 'bg-white' : 'bg-white/20'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                        <span className={step >= 1 ? 'text-white font-medium' : 'text-white/60'}>Service Info</span>
                        <span className={step >= 2 ? 'text-white font-medium' : 'text-white/60'}>Location</span>
                        <span className={step >= 3 ? 'text-white font-medium' : 'text-white/60'}>Documents</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {isUnderReview && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
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
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6">
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
                        <Card className="border-2 border-primary/10">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">1</span>
                                    Service Information
                                </h2>

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
                        <Card className="border-2 border-primary/10">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">2</span>
                                    Location
                                </h2>

                                <div className="space-y-4">
                                    <Button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        isLoading={detectingLocation}
                                        disabled={detectingLocation || isUnderReview}
                                        className="w-full bg-primary hover:bg-primary-600"
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
                                        <p className="text-error text-sm">{errors.location}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card className="border-2 border-primary/10">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">3</span>
                                    Documents
                                </h2>

                                <div className="space-y-6">
                                    {/* Resume Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-3">
                                            Resume (PDF) *
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
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
                                                        className="text-primary hover:underline text-sm"
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
                                                        className="cursor-pointer text-primary hover:text-primary-600 font-medium"
                                                    >
                                                        Click to upload PDF
                                                    </label>
                                                    <p className="text-xs text-text-muted mt-1">Max size: 5MB</p>
                                                </>
                                            )}
                                        </div>
                                        {errors.resume && <p className="text-error text-sm mt-2">{errors.resume}</p>}
                                    </div>

                                    {/* Demo Video Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-3">
                                            Demo Video (MP4) *
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
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
                                                        className="text-primary hover:underline text-sm"
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
                                                        className="cursor-pointer text-primary hover:text-primary-600 font-medium"
                                                    >
                                                        Click to upload MP4
                                                    </label>
                                                    <p className="text-xs text-text-muted mt-1">Max size: 50MB</p>
                                                </>
                                            )}
                                        </div>
                                        {errors.demoVideo && <p className="text-error text-sm mt-2">{errors.demoVideo}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">Required Information</h3>
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
                                            <CheckIcon size={16} color="#5B21B6" className="mt-0.5 flex-shrink-0" />
                                            <span className="text-text-secondary">{item}</span>
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
                                className="w-full bg-gradient-to-r from-[#5B21B6] to-[#6366F1] hover:from-[#6366F1] hover:to-[#7C3AED] text-white py-6 text-lg font-semibold"
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
        </div>
    )
}
