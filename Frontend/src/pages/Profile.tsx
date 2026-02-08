import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useNavigate } from 'react-router-dom'
import { providerService } from '../services/providerService'
import { ProfileSkeleton } from '../components/ui/Loader'
import {
  PhoneIcon,
  LogOutIcon,
  MapPinIcon,
  WalletIcon,
  TagIcon,
  HeadphonesIcon,
  ArrowRightIcon,
  LightningIcon,
  CleaningIcon,
  PlumbingIcon,
  UserIcon,
} from '../components/icons/CustomIcons'
import type { ProviderProfile } from '../types'
import { PortfolioGallery } from '../components/PortfolioGallery'
import toast from 'react-hot-toast'

const SERVICE_MAPPING: Record<string, { label: string; icon: any; color: string }> = {
  CLEANER: { label: 'Cleaning Specialist', icon: CleaningIcon, color: '#5B21B6' },
  PLUMBER: { label: 'Plumbing Expert', icon: PlumbingIcon, color: '#F97316' },
  ELECTRICIAN: { label: 'Electrical Expert', icon: LightningIcon, color: '#F59E0B' },
  LAUNDRY: { label: 'Laundry Service', icon: CleaningIcon, color: '#5B21B6' },
  OTHER: { label: 'Service Provider', icon: UserIcon, color: '#6B7280' },
}

const ProviderProfileView = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [services, setServices] = useState<
    { id: number; name: string; description: string; price: number; unit: string; active: boolean; color: string }[]
  >([])
  const [showAddService, setShowAddService] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'hr',
    active: true,
  })
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null)
  const [editingService, setEditingService] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'hr',
    active: true,
  })

  // Enhanced profile states
  const [profileBio, setProfileBio] = useState('')
  const [profileTagline, setProfileTagline] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [yearsExperience, setYearsExperience] = useState(0)
  const [portfolioImages, setPortfolioImages] = useState<{ id: number, url: string }[]>([])
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('')

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Handle portfolio image upload
  const handlePortfolioImageUpload = async (files: FileList) => {
    if (!profile) return

    try {
      const uploadedImages: { id: number; url: string }[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const updatedProfile = await providerService.uploadPortfolioImage(profile.id, file)
        // Get the newly added image URL from the updated profile
        const newImages = updatedProfile.portfolioImages || []
        const newImage = newImages[newImages.length - 1] // Last added image
        if (newImage) {
          uploadedImages.push({
            id: Date.now() + i, // Simple ID generation
            url: newImage
          })
        }
      }
      setPortfolioImages(prev => [...prev, ...uploadedImages])
    } catch (error) {
      console.error('Failed to upload portfolio images', error)
    }
  }

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file: File) => {
    if (!profile) return

    try {
      const updatedProfile = await providerService.uploadPortfolioImage(profile.id, file)

      // Use the uploaded image as profile photo (get the last uploaded image)
      if (updatedProfile.portfolioImages && updatedProfile.portfolioImages.length > 0) {
        const uploadedUrl = updatedProfile.portfolioImages[updatedProfile.portfolioImages.length - 1]
        console.log('Uploaded photo URL:', uploadedUrl)
        console.log('Full URL:', uploadedUrl)
        setProfilePhotoUrl(uploadedUrl)
        setProfile(updatedProfile) // Update profile state
        toast.success('Profile photo uploaded successfully!')
      }
    } catch (error) {
      console.error('Failed to upload profile photo', error)
      toast.error('Failed to upload profile photo')
    }
  }

  // Handle portfolio image deletion
  const handlePortfolioImageDelete = async (id: number) => {
    if (!profile) return

    try {
      const imageToDelete = portfolioImages.find(img => img.id === id)
      if (imageToDelete) {
        // Strip the localhost prefix before sending to backend
        const relativeUrl = imageToDelete.url
        const updatedProfile = await providerService.removePortfolioImage(profile.id, relativeUrl)
        setPortfolioImages(prev => prev.filter(img => img.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete portfolio image', error)
    }
  }

  // Handle saving the profile
  const handleSaveProfile = async () => {
    if (!profile) return

    // Validate required fields
    if (!profileBio || profileBio.trim() === '') {
      console.error('Description/bio is required')
      toast.error('Please provide a description/bio for your profile')
      return
    }

    try {
      const updateData: any = {
        serviceType: profile.serviceType, // Keep existing service type
        description: profileBio.trim(),
        experienceYears: yearsExperience || 0,
        portfolioImages: portfolioImages.map(img => img.url), // Send image URLs to backend
        displayName: displayName.trim() || null,
        profilePhotoUrl: profilePhotoUrl || null,
        tagline: profileTagline.trim() || null
      }

      // Only include optional fields if they have valid values
      if (profile.basePrice && profile.basePrice > 0) {
        updateData.basePrice = profile.basePrice
      }
      if (profile.locationLat !== null && profile.locationLat !== undefined) {
        updateData.locationLat = profile.locationLat
      }
      if (profile.locationLng !== null && profile.locationLng !== undefined) {
        updateData.locationLng = profile.locationLng
      }

      const updatedProfile = await providerService.updateProfile(profile.id, updateData)

      // Update the profile state with the response
      setProfile(updatedProfile)

      // Update local state with saved values from backend
      setDisplayName(updatedProfile.displayName || user?.name || '')
      setProfileBio(updatedProfile.description || '')
      setProfileTagline(updatedProfile.tagline || '')
      setYearsExperience(updatedProfile.experienceYears || 0)
      setProfilePhotoUrl(updatedProfile.profilePhotoUrl || '')

      // Update portfolio images
      if (updatedProfile.portfolioImages) {
        const imagesWithIds = updatedProfile.portfolioImages.map((url, index) => ({
          id: index + 1,
          url: url
        }))
        setPortfolioImages(imagesWithIds)
      }

      setIsEditingProfile(false)

      // Show success message
      console.log('Profile saved successfully')
      toast.success('Profile saved successfully!')
    } catch (error: any) {
      console.error('Failed to save profile', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      toast.error(`Failed to save profile: ${errorMessage}`)
    }
  }

  useEffect(() => {
    fetchData(true)
  }, [user?.id])

  const fetchData = async (showLoader = false) => {
    if (!user) return
    try {
      if (showLoader) setIsLoading(true)
      const providersData = await providerService.getAllProviders()
      const provider = providersData.find((p) => p.userId === user.id) || null
      setProfile(provider)

      // Pre-populate profile fields from provider data
      if (provider) {
        setDisplayName(provider.displayName || user.name)
        setProfileBio(provider.description || '')
        setProfileTagline(provider.tagline || '')
        setYearsExperience(provider.experienceYears || 0)
        setProfilePhotoUrl(provider.profilePhotoUrl || '')

        // Initialize portfolio images
        if (provider.portfolioImages) {
          const imagesWithIds = provider.portfolioImages.map((url, index) => ({
            id: index + 1,
            url: url
          }))
          setPortfolioImages(imagesWithIds)
        }
      }
    } catch (error) {
      console.error('Failed to load provider profile', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load services when profile is available
  useEffect(() => {
    const loadServices = async () => {
      if (!profile) return
      try {
        const list = await providerService.listServices(profile.id)
        const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
        setServices(
          list.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description || '',
            price: s.price,
            unit: s.unit,
            active: s.active,
            color,
          })),
        )
      } catch (error) {
        console.error('Failed to load services', error)
      }
    }
    loadServices()
  }, [profile])


  const handleAddService = () => {
    if (!newService.name.trim()) return
    if (!profile) return
    providerService
      .addService(profile.id, {
        name: newService.name.trim(),
        description: newService.description.trim() || 'No description provided.',
        price: newService.price,
        unit: newService.unit,
        active: newService.active,
      })
      .then((created) => {
        const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
        setServices((prev) => [
          ...prev,
          {
            id: created.id,
            name: created.name,
            description: created.description || '',
            price: created.price,
            unit: created.unit,
            active: created.active,
            color,
          },
        ])
        setNewService({ name: '', description: '', price: 0, unit: 'hr', active: true })
        setShowAddService(false)
      })
      .catch((err) => {
        console.error('Failed to add service', err)
      })
  }

  const startEditService = (svcId: number) => {
    const target = services.find((s) => s.id === svcId)
    if (!target) return
    setEditingServiceId(svcId)
    setEditingService({
      name: target.name,
      description: target.description || '',
      price: target.price,
      unit: target.unit,
      active: target.active,
    })
  }

  const toggleServiceActive = (svcId: number, next: boolean) => {
    const target = services.find((s) => s.id === svcId)
    if (!profile || !target) return
    providerService
      .updateService(profile.id, svcId, {
        name: target.name,
        description: target.description || '',
        price: target.price,
        unit: target.unit,
        active: next,
      })
      .then((updated) => {
        const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
        setServices((prev) =>
          prev.map((s) =>
            s.id === updated.id
              ? {
                id: updated.id,
                name: updated.name,
                description: updated.description || '',
                price: updated.price,
                unit: updated.unit,
                active: updated.active,
                color,
              }
              : s,
          ),
        )
      })
      .catch((err) => {
        console.error('Failed to update service status', err)
      })
  }

  const handleUpdateService = () => {
    if (!profile || editingServiceId == null) return
    providerService
      .updateService(profile.id, editingServiceId, {
        name: editingService.name.trim(),
        description: editingService.description?.trim() || '',
        price: editingService.price,
        unit: editingService.unit,
        active: editingService.active,
      })
      .then((updated) => {
        const color = (SERVICE_MAPPING[profile.serviceType] || SERVICE_MAPPING.OTHER).color
        setServices((prev) =>
          prev.map((s) =>
            s.id === updated.id
              ? {
                id: updated.id,
                name: updated.name,
                description: updated.description || '',
                price: updated.price,
                unit: updated.unit,
                active: updated.active,
                color,
              }
              : s,
          ),
        )
        setEditingServiceId(null)
      })
      .catch((err) => {
        console.error('Failed to update service', err)
      })
  }

  if (!user) return null

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Full width layout */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-semibold text-text-primary">Profile & Availability</h1>
            <p className="text-sm text-text-secondary">
              Manage your public info, service menu, and working hours.
            </p>
          </div>
        </div>

        {/* Professional Profile Section */}
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Professional Profile</h2>
                <p className="text-sm text-text-secondary mt-1">Showcase your expertise to customers</p>
              </div>
              {!isEditingProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <span className="material-symbols-outlined text-sm mr-2">edit</span>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingProfile(false)
                      // Reset to saved values
                      if (profile) {
                        setDisplayName((profile as any).displayName || user.name)
                        setProfileBio((profile as any).bio || profile.description || '')
                        setProfileTagline((profile as any).tagline || '')
                        setYearsExperience((profile as any).yearsExperience || 0)
                        setProfilePhotoUrl((profile as any).profilePhotoUrl || '')

                        // Reset portfolio images
                        if (profile.portfolioImages) {
                          const imagesWithIds = profile.portfolioImages.map((url, index) => ({
                            id: index + 1,
                            url: `http://localhost:3000${url}`
                          }))
                          setPortfolioImages(imagesWithIds)
                        }
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    <span className="material-symbols-outlined text-sm mr-2">check</span>
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Profile Photo
                </label>
                {isEditingProfile ? (
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon size={40} color="#9CA3AF" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files[0]) {
                          handleProfilePhotoUpload(e.target.files[0])
                        }
                      }}
                      className="block text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon size={40} color="#9CA3AF" />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Display Name / Business Name
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., John's Professional Cleaning"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                  />
                ) : (
                  <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
                    {displayName || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Professional Tagline
                </label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileTagline}
                    onChange={(e) => setProfileTagline(e.target.value)}
                    placeholder="e.g., Your Trusted Cleaning Expert"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                    maxLength={100}
                  />
                ) : (
                  <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
                    {profileTagline || 'Not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  About / Bio
                </label>
                {isEditingProfile ? (
                  <>
                    <textarea
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="Tell customers about your experience, specializations, and what makes you stand out..."
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-text-muted mt-1">{profileBio.length}/500 characters</p>
                  </>
                ) : (
                  <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl min-h-[100px] whitespace-pre-wrap">
                    {profileBio || 'Not set'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Years of Experience
                  </label>
                  {isEditingProfile ? (
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                    >
                      <option value={0}>Select experience</option>
                      {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'year' : 'years'}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-base text-text-primary py-3 px-4 bg-gray-50 rounded-xl">
                      {yearsExperience > 0 ? `${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'}` : 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Payout Settings</h3>
                  <p className="text-xs text-text-secondary">
                    {profile?.stripeAccountId
                      ? 'Your account is connected to Stripe for payouts.'
                      : 'Connect with Stripe to receive payments directly to your bank account.'}
                  </p>
                </div>
                {profile?.stripeAccountId ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-100">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="text-sm font-medium">Payouts Enabled</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#635BFF] hover:bg-[#5851df] text-white" // Stripe blurple color
                    onClick={async () => {
                      if (!profile || !user) return;
                      try {
                        // Use current URL as base for refresh/return
                        const returnUrl = window.location.href;
                        const refreshUrl = window.location.href;

                        // Get token from auth context or local storage? 
                        // Hook useAuth usually provides token, but if not we can get it from localStorage or api 
                        // Assuming api handles token injection or we get it from local storage
                        const token = localStorage.getItem('token') || '';

                        const { url } = await import('../api').then(m => m.paymentApi.onboardProvider(profile.id, refreshUrl, returnUrl, token));

                        if (url) {
                          window.location.href = url;
                        }
                      } catch (error) {
                        console.error('Failed to start onboarding', error);
                        toast.error('Failed to start setup. Please try again.');
                      }
                    }}
                  >
                    Setup Payouts
                    <span className="material-symbols-outlined text-sm ml-2">open_in_new</span>
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Portfolio Gallery Section */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <PortfolioGallery
              images={portfolioImages.map(img => ({ ...img, category: 'work' as const }))}
              onUpload={handlePortfolioImageUpload}
              onDelete={handlePortfolioImageDelete}
              editable
            />
          </CardContent>
        </Card>

        {/* Service menu only */}
        <Card className="border border-border">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Service Menu</p>
                <p className="text-base font-semibold text-text-primary">
                  Manage your offerings and pricing.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-text-primary"
                onClick={() => setShowAddService(true)}
              >
                Add Service
              </Button>
            </div>

            {showAddService && (
              <div className="rounded-xl border border-border bg-[#F9FAFB] p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">Service Name</p>
                    <input
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={newService.name}
                      onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Deep Cleaning"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">Price</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                        value={newService.price}
                        onChange={(e) => setNewService((s) => ({ ...s, price: Number(e.target.value) }))}
                        placeholder="50"
                        min={0}
                      />
                      <span className="text-sm text-text-secondary">/ {newService.unit}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-secondary">Description</p>
                  <textarea
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                    rows={2}
                    value={newService.description}
                    onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
                    placeholder="What is included?"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={newService.active}
                      onChange={(e) => setNewService((s) => ({ ...s, active: e.target.checked }))}
                    />
                    Active
                  </label>
                  <div className="ml-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-text-primary"
                      onClick={() => {
                        setShowAddService(false)
                        setNewService({ name: '', description: '', price: 0, unit: 'hr', active: true })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-primary text-white" onClick={handleAddService}>
                      Save Service
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-border bg-white shadow-soft p-4 space-y-3 flex flex-col md:flex-row md:items-center md:space-y-0 md:justify-between"
                >
                  {editingServiceId === svc.id ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-text-secondary">Service Name</p>
                          <input
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                            value={editingService.name}
                            onChange={(e) => setEditingService((s) => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-text-secondary">Price</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                              value={editingService.price}
                              onChange={(e) => setEditingService((s) => ({ ...s, price: Number(e.target.value) }))}
                              min={0}
                            />
                            <span className="text-sm text-text-secondary">/ {editingService.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-text-secondary">Description</p>
                        <textarea
                          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                          rows={2}
                          value={editingService.description}
                          onChange={(e) => setEditingService((s) => ({ ...s, description: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                          <input
                            type="checkbox"
                            checked={editingService.active}
                            onChange={(e) => setEditingService((s) => ({ ...s, active: e.target.checked }))}
                          />
                          Active
                        </label>
                        <div className="ml-auto flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-text-primary"
                            onClick={() => setEditingServiceId(null)}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" className="bg-primary text-white" onClick={handleUpdateService}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${svc.color}15` }}
                        >
                          <LightningIcon size={20} color={svc.color} />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary flex items-center gap-2">
                            {svc.name}
                            <span
                              className={`text-[11px] font-semibold px-2 py-1 rounded-full ${svc.active ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#F3F4F6] text-[#6B7280]'
                                }`}
                            >
                              {svc.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </p>
                          <p className="text-xs text-text-secondary">{svc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-text-primary">
                          ₹{svc.price.toLocaleString()} <span className="text-xs text-text-secondary">/ {svc.unit}</span>
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                          <input
                            type="checkbox"
                            checked={svc.active}
                            onChange={(e) => toggleServiceActive(svc.id, e.target.checked)}
                          />
                          {svc.active ? 'On' : 'Off'}
                        </label>
                        <Button variant="outline" size="sm" className="border-border text-text-primary" onClick={() => startEditService(svc.id)}>
                          Edit
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}

const UserProfileView = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    city: user.city || ''
  })
  const navigate = useNavigate()
  const { fetchUser } = useAuth() // Assuming fetchUser refreshes user data in context

  const handleSave = async () => {
    try {
      await import('../services/userService').then(m => m.userService.updateUser(user.id, editForm))
      setIsEditing(false)
      toast.success('Profile updated successfully')
      // Refresh user context if possible, or just wait for reload. 
      // Ideally AuthContext should expose a reload or we manually update it.
      // For now, reload page to reflect simple changes or assume Context updates eventually.
      window.location.reload()
    } catch (error) {
      console.error('Failed to update profile', error)
      toast.error('Failed to update profile')
    }
  }

  const quickLinks = [
    {
      icon: WalletIcon, // Reusing WalletIcon as "Bookings" indicator for now if Calendar isn't available
      label: 'My Bookings',
      description: 'View past and upcoming jobs',
      path: '/bookings',
      color: '#6366F1',
      action: () => navigate('/bookings')
    },
    {
      icon: HeadphonesIcon,
      label: 'Help & Support',
      description: 'Contact our support team',
      path: '#',
      color: '#10B981',
      action: () => window.location.href = 'mailto:support@quickfix.com'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      {/* Hero Section / Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-large p-8 md:p-12">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-white opacity-10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
          <div className="relative">
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-full p-1 bg-white/20 backdrop-blur-sm shadow-xl flex items-center justify-center">
              <Avatar name={user.name} className="h-full w-full border-4 border-white text-3xl font-bold" />
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            {isEditing ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-white/80 text-sm pl-1">Full Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 text-sm pl-1">Phone Number</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/80 text-sm pl-1">City</label>
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {user.name}
                </h1>
                <div className="flex flex-col md:flex-row items-center gap-4 text-white/90 font-medium">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm border border-white/10">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    {user.email}
                  </div>
                  {(user.phone || user.city) && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm border border-white/10">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      {[user.phone, user.city].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="mt-4 md:mt-0">
              <Button
                variant="secondary"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all font-semibold shadow-lg"
                onClick={() => setIsEditing(true)}
              >
                <span className="material-symbols-outlined text-xl mr-2">edit</span>
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Section */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2 px-1">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((item, index) => {
            const Icon = item.icon
            return (
              <Card
                key={index}
                className="group cursor-pointer border-transparent hover:border-primary/10 transition-all duration-300 hover:shadow-medium hover:-translate-y-1 overflow-hidden relative"
                onClick={item.action}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRightIcon size={20} color={item.color} />
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <Icon size={24} color={item.color} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1 group-hover:text-text-primary/80 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Logout Section */}
      <div className="flex justify-center pt-8">
        <Button
          variant="outline"
          className="text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 w-full md:w-auto px-8 py-4 rounded-xl hover:shadow-md transition-all"
          onClick={onLogout}
        >
          <LogOutIcon size={20} color="currentColor" className="mr-2" />
          <span className="font-semibold text-lg">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}

export const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  if (user.role === 'PROVIDER') {
    return <ProviderProfileView />
  }

  return <UserProfileView user={user} onLogout={handleLogout} />
}
