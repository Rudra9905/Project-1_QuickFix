import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Loader } from '../components/ui/Loader'
import { ArrowLeftIcon, CheckIcon, XCircleIcon } from '../components/icons/CustomIcons'
import type { ProviderProfile } from '../types'

export const ProviderReviewDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProvider(parseInt(id))
    }
  }, [id])

  const fetchProvider = async (providerId: number) => {
    try {
      setLoading(true)
      const providerData = await adminService.getProvider(providerId)
      setProvider(providerData)
    } catch (err) {
      console.error('Failed to fetch provider:', err)
      setError('Failed to load provider details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!provider) return
    
    try {
      setIsSubmitting(true)
      await adminService.decideProvider(provider.id, 'APPROVE')
      navigate('/admin')
    } catch (err) {
      console.error('Failed to approve provider:', err)
      setError('Failed to approve provider')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!provider) return
    
    try {
      setIsSubmitting(true)
      await adminService.decideProvider(provider.id, 'REJECT', rejectReason)
      navigate('/admin')
    } catch (err) {
      console.error('Failed to reject provider:', err)
      setError('Failed to reject provider')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate('/admin')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={() => id && fetchProvider(parseInt(id))}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error mb-4">Provider not found</p>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeftIcon size={16} color="#4C0FA8" className="mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-text-primary">Provider Review</h1>
        <p className="text-text-secondary">Review provider application before approval</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Service Type</p>
                  <p className="font-medium">{provider.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Experience</p>
                  <p className="font-medium">{provider.experienceYears} years</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Base Price</p>
                  <p className="font-medium">₹{provider.basePrice}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    {provider.profileStatus}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-text-secondary">Description</p>
                <p className="font-medium">{provider.description || 'No description provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Files Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-2">Resume</p>
                {provider.resumeUrl ? (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Resume.pdf</p>
                    <a 
                      href={provider.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                ) : (
                  <p className="text-text-secondary">No resume uploaded</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-text-secondary mb-2">Demo Video</p>
                {provider.demoVideoUrl ? (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Demo.mp4</p>
                    <a 
                      href={provider.demoVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Demo Video
                    </a>
                  </div>
                ) : (
                  <p className="text-text-secondary">No demo video uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Please review the provider's information and documents before making a decision.
              </p>
              
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  <CheckIcon size={16} color="white" className="mr-2" />
                  Approve Provider
                </Button>
                
                <Textarea
                  label="Rejection Reason (Optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                />
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <XCircleIcon size={16} color="#DC2626" className="mr-2" />
                  Reject Provider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}