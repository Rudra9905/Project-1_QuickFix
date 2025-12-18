import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { providerService } from '../services/providerService'
import toast from 'react-hot-toast'
import type { ServiceType } from '../types'

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'PLUMBER', label: 'Plumber' },
  { value: 'ELECTRICIAN', label: 'Electrician' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'OTHER', label: 'Other' },
]

export const CreateProviderProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    serviceType: '' as ServiceType | '',
    description: '',
    basePrice: '',
    locationLat: '',
    locationLng: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.serviceType) {
      newErrors.serviceType = 'Service type is required'
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) return

    setIsLoading(true)
    try {
      await providerService.createProfile(user.id, {
        serviceType: formData.serviceType as ServiceType,
        description: formData.description || undefined,
        basePrice: formData.basePrice ? parseInt(formData.basePrice) : undefined,
        locationLat: parseFloat(formData.locationLat),
        locationLng: parseFloat(formData.locationLng),
      })
      toast.success('Provider profile created successfully!')
      // Redirect to profile completion page after successful profile creation
      navigate('/complete-provider-profile')
    } catch (error: any) {
      console.error('Error creating provider profile:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create profile'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Only providers can create profiles</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Provider Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Service Type"
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({ ...formData, serviceType: e.target.value as ServiceType | '' })
              }
              error={errors.serviceType}
              options={[
                { value: '', label: 'Select a service type' },
                ...SERVICE_TYPES,
              ]}
            />
            <Textarea
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your services..."
              rows={4}
            />
            <Input
              label="Base Price (Optional)"
              type="number"
              value={formData.basePrice}
              onChange={(e) =>
                setFormData({ ...formData, basePrice: e.target.value })
              }
              error={errors.basePrice}
              placeholder="100"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={formData.locationLat}
                onChange={(e) =>
                  setFormData({ ...formData, locationLat: e.target.value })
                }
                error={errors.locationLat}
                placeholder="40.7128"
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={formData.locationLng}
                onChange={(e) =>
                  setFormData({ ...formData, locationLng: e.target.value })
                }
                error={errors.locationLng}
                placeholder="-74.0060"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Create Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}