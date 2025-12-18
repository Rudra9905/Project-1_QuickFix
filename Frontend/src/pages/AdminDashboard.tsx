import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { EyeIcon, CheckIcon, XCircleIcon } from '../components/icons/CustomIcons'
import type { ProviderProfile } from '../types'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [pendingProviders, setPendingProviders] = useState<ProviderProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingProviders()
  }, [])

  const fetchPendingProviders = async () => {
    try {
      setLoading(true)
      const providers = await adminService.listPendingProviders()
      setPendingProviders(providers)
    } catch (err) {
      console.error('Failed to fetch pending providers:', err)
      setError('Failed to load pending providers')
    } finally {
      setLoading(false)
    }
  }

  const handleViewProvider = (providerId: number) => {
    navigate(`/admin/providers/${providerId}`)
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
          <Button onClick={fetchPendingProviders}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Dashboard</h1>
        <p className="text-text-secondary">Review and manage provider applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Provider Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckIcon size={24} color="#4C0FA8" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-1">No pending applications</h3>
              <p className="text-text-secondary">All provider applications have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProviders.map((provider) => (
                <div 
                  key={provider.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-background-app transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-text-primary">{provider.userId}</h3>
                    <p className="text-sm text-text-secondary">{provider.serviceType}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Submitted: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewProvider(provider.id)}
                    >
                      <EyeIcon size={16} color="#4C0FA8" className="mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
