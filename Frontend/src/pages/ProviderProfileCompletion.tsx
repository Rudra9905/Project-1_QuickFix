import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { providerService } from '../services/providerService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { AlertCircleIcon, CheckIcon, ClockIcon, XCircleIcon } from '../components/icons/CustomIcons'
import toast from 'react-hot-toast'
import type { ServiceType, ProviderProfile } from '../types'

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'PLUMBER', label: 'Plumber' },
  { value: 'ELECTRICIAN', label: 'Electrician' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'OTHER', label: 'Other' },
]

export const ProviderProfileCompletion = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    serviceType: '' as ServiceType | '',
    description: '',
    experienceYears: '',
    basePrice: '',
    locationLat: '',
    locationLng: '',
  })
  const [fileData, setFileData] = useState({
    resume: null as File | null,
    demoVideo: null as File | null,
  })
  const [resumePreview, setResumePreview] = useState<string | null>(null)
  const [demoVideoPreview, setDemoVideoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProviderProfile()
  }, [user?.id])

  const fetchProviderProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const providerProfile = await providerService.getProviderByUserId(user.id)
      setProfile(providerProfile)
      
      if (providerProfile) {
        setFormData({
          serviceType: providerProfile.serviceType || '',
          description: providerProfile.description || '',
          experienceYears: providerProfile.experienceYears?.toString() || '',
          basePrice: providerProfile.basePrice?.toString() || '',
          locationLat: providerProfile.locationLat?.toString() || '',
          locationLng: providerProfile.locationLng?.toString() || '',
        })
        
        // Set previews if URLs exist
        if (providerProfile.resumeUrl) {
          setResumePreview(providerProfile.resumeUrl)
        }
        if (providerProfile.demoVideoUrl) {
          setDemoVideoPreview(providerProfile.demoVideoUrl)
        }
      }
    } catch (error) {
      console.error('Failed to fetch provider profile:', error)
      toast.error('Failed to load provider profile')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.serviceType) {
      newErrors.serviceType = 'Service type is required'
    }
    
    if (!formData.experienceYears || isNaN(parseInt(formData.experienceYears))) {
      newErrors.experienceYears = 'Valid experience years is required'
    }
    
    if (!formData.locationLat || isNaN(parseFloat(formData.locationLat))) {
      newErrors.locationLat = 'Valid latitude is required'
    }
    
    if (!formData.locationLng || isNaN(parseFloat(formData.locationLng))) {
      newErrors.locationLng = 'Valid longitude is required'
    }
    
    if (formData.basePrice && isNaN(parseInt(formData.basePrice))) {
      newErrors.basePrice = 'Base price must be a number'
    }
    
    if (!resumePreview) {
      newErrors.resume = 'Resume is required'
    }
    
    if (!demoVideoPreview) {
      newErrors.demoVideo = 'Demo video is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validate() || !user || !profile) return
    
    setSaving(true)
    try {
      const updatedProfile = await providerService.updateProfile(profile.id, {
        serviceType: formData.serviceType as ServiceType,
        description: formData.description || undefined,
        experienceYears: parseInt(formData.experienceYears),
        basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
        locationLat: parseFloat(formData.locationLat),
        locationLng: parseFloat(formData.locationLng),
      })
      
      setProfile(updatedProfile)
      toast.success('Profile saved successfully!')
    } catch (error: any) {
      console.error('Error saving provider profile:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'demoVideo') => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setFileData(prev => ({ ...prev, [fileType]: file }))
    
    // Create preview
    if (fileType === 'resume') {
      setResumePreview(URL.createObjectURL(file))
    } else {
      setDemoVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadFile = async (fileType: 'resume' | 'demoVideo') => {
    if (!profile || !fileData[fileType]) return
    
    try {
      let updatedProfile: ProviderProfile
      
      if (fileType === 'resume') {
        updatedProfile = await providerService.uploadResume(profile.id, fileData.resume!)
      } else {
        updatedProfile = await providerService.uploadDemoVideo(profile.id, fileData.demoVideo!)
      }
      
      setProfile(updatedProfile)
      toast.success(`${fileType === 'resume' ? 'Resume' : 'Demo video'} uploaded successfully!`)
      
      // Clear the file input
      setFileData(prev => ({ ...prev, [fileType]: null }))
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error)
      
      // More detailed error handling
      let errorMessage = `Failed to upload ${fileType}`;
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                      error.response.statusText || 
                      `Server error (${error.response.status})`;
        console.error('Server response:', error.response);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error - could not reach server';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      toast.error(errorMessage)
    }
  }

  const handleSubmitForReview = async () => {
    if (!profile) return
    
    // Validate before submitting
    if (!validate()) {
      toast.error('Please complete all required fields before submitting')
      return
    }
    
    setSubmitting(true)
    try {
      const updatedProfile = await providerService.submitForReview(profile.id)
      setProfile(updatedProfile)
      toast.success('Profile submitted for review!')
    } catch (error: any) {
      console.error('Error submitting for review:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit for review'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSubmission = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (!user || user.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Only providers can access this page</p>
      </div>
    )
  }

  // If profile is already approved, redirect to dashboard
  if (profile?.profileStatus === 'APPROVED') {
    navigate('/dashboard')
    return null
  }

  const isProfileEditable = profile?.profileStatus === 'INCOMPLETE' || profile?.profileStatus === 'REJECTED'
  const isUnderReview = profile?.profileStatus === 'PENDING_APPROVAL'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Complete Your Provider Profile</h1>
        <p className="text-text-secondary">
          Fill in all required information and upload documents to submit for admin review.
        </p>
      </div>

      {/* Status Banner */}
      {profile && (
        <div className="mb-6">
          {profile.profileStatus === 'INCOMPLETE' && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircleIcon size={20} color="#FF9D2B" className="mr-2" />
                <div>
                  <p className="font-medium text-warning">Profile Incomplete</p>
                  <p className="text-sm text-warning">Complete all fields and submit for review</p>
                </div>
              </div>
            </div>
          )}
          
          {profile.profileStatus === 'PENDING_APPROVAL' && (
            <div className="bg-info/10 border border-info/20 rounded-xl p-4">
              <div className="flex items-center">
                <ClockIcon size={20} color="#00B6D8" className="mr-2" />
                <div>
                  <p className="font-medium text-info">Under Review</p>
                  <p className="text-sm text-info">Your profile is being reviewed by admins</p>
                </div>
              </div>
            </div>
          )}
          
          {profile.profileStatus === 'REJECTED' && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4">
              <div className="flex items-center">
                <XCircleIcon size={20} color="#DC2626" className="mr-2" />
                <div className="flex-1">
                  <p className="font-medium text-error">Profile Rejected</p>
                  {profile.rejectionReason && (
                    <p className="text-sm text-error">Reason: {profile.rejectionReason}</p>
                  )}
                  <p className="text-sm text-error">Please update your profile and resubmit</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Service Type *"
                value={formData.serviceType}
                onChange={(e) =>
                  setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
                }
                error={errors.serviceType}
                options={[
                  { value: '', label: 'Select a service type' },
                  ...SERVICE_TYPES,
                ]}
                disabled={!isProfileEditable}
              />
              
              <Textarea
                label="Description *"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your services and expertise..."
                rows={4}
                disabled={!isProfileEditable}
                error={errors.description}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Experience (years) *"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    setFormData({ ...formData, experienceYears: e.target.value })
                  }
                  error={errors.experienceYears}
                  placeholder="5"
                  disabled={!isProfileEditable}
                />
                
                <Input
                  label="Base Price (₹) *"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                  error={errors.basePrice}
                  placeholder="500"
                  disabled={!isProfileEditable}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitude *"
                  type="number"
                  step="any"
                  value={formData.locationLat}
                  onChange={(e) =>
                    setFormData({ ...formData, locationLat: e.target.value })
                  }
                  error={errors.locationLat}
                  placeholder="40.7128"
                  disabled={!isProfileEditable}
                />
                
                <Input
                  label="Longitude *"
                  type="number"
                  step="any"
                  value={formData.locationLng}
                  onChange={(e) =>
                    setFormData({ ...formData, locationLng: e.target.value })
                  }
                  error={errors.locationLng}
                  placeholder="-74.0060"
                  disabled={!isProfileEditable}
                />
              </div>
              
              {isProfileEditable && (
                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    isLoading={saving}
                    disabled={saving}
                  >
                    Save Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resume Upload */}
              <div>
                <p className="text-sm font-label text-text-primary mb-2">Resume (PDF) *</p>
                {isProfileEditable ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'resume')}
                        className="flex-1"
                        disabled={!isProfileEditable}
                      />
                      <Button
                        onClick={() => handleUploadFile('resume')}
                        disabled={!fileData.resume || !isProfileEditable}
                        size="sm"
                      >
                        Upload
                      </Button>
                    </div>
                    {errors.resume && (
                      <p className="text-error text-sm">{errors.resume}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary">Profile is under review. Document upload is disabled.</p>
                )}
                
                {resumePreview && (
                  <div className="mt-3 p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium mb-2">Uploaded Resume:</p>
                    <a 
                      href={resumePreview} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>
              
              {/* Demo Video Upload */}
              <div>
                <p className="text-sm font-label text-text-primary mb-2">Demo Video (MP4) *</p>
                {isProfileEditable ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) => handleFileChange(e, 'demoVideo')}
                        className="flex-1"
                        disabled={!isProfileEditable}
                      />
                      <Button
                        onClick={() => handleUploadFile('demoVideo')}
                        disabled={!fileData.demoVideo || !isProfileEditable}
                        size="sm"
                      >
                        Upload
                      </Button>
                    </div>
                    {errors.demoVideo && (
                      <p className="text-error text-sm">{errors.demoVideo}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary">Profile is under review. Document upload is disabled.</p>
                )}
                
                {demoVideoPreview && (
                  <div className="mt-3 p-3 border border-border rounded-lg">
                    <p className="text-sm font-medium mb-2">Uploaded Demo Video:</p>
                    <a 
                      href={demoVideoPreview} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Demo Video
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary">Current Status</p>
                    <p className="font-medium capitalize">
                      {profile.profileStatus.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  
                  {profile.profileStatus === 'REJECTED' && profile.rejectionReason && (
                    <div>
                      <p className="text-sm text-text-secondary">Rejection Reason</p>
                      <p className="font-medium text-error">{profile.rejectionReason}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 space-y-3">
                    {isProfileEditable && (
                      <Button
                        className="w-full"
                        onClick={handleSubmitForReview}
                        isLoading={submitting}
                        disabled={submitting}
                      >
                        Submit for Review
                      </Button>
                    )}
                    
                    {isUnderReview && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCancelSubmission}
                      >
                        Back to Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary">Create a profile to see status</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Service type and description</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Years of experience</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Base service price</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Location coordinates</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Resume (PDF format)</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon size={16} color="#00B76B" className="mr-2 flex-shrink-0" />
                  <span>Demo video (MP4 format)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}