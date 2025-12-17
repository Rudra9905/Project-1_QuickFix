import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { Loader } from '../components/ui/Loader'
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
import type { Booking, ProviderProfile } from '../types'

const SERVICE_MAPPING: Record<string, { label: string; icon: any; color: string }> = {
  CLEANER: { label: 'Cleaning Specialist', icon: CleaningIcon, color: '#5B2ECC' },
  PLUMBER: { label: 'Plumbing Expert', icon: PlumbingIcon, color: '#F97316' },
  ELECTRICIAN: { label: 'Electrical Expert', icon: LightningIcon, color: '#F59E0B' },
  LAUNDRY: { label: 'Laundry Service', icon: CleaningIcon, color: '#5B2ECC' },
  OTHER: { label: 'Service Provider', icon: UserIcon, color: '#6B7280' },
}

const ProviderProfileView = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weeklyAvailability, setWeeklyAvailability] = useState(
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      start: '09:00 AM',
      end: '06:00 PM',
      active: true,
    })),
  )
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

  useEffect(() => {
    fetchData(true)
    const interval = setInterval(() => fetchData(), 15000)
    return () => clearInterval(interval)
  }, [user?.id])

  const fetchData = async (showLoader = false) => {
    if (!user) return
    try {
      if (showLoader) setIsLoading(true)
      const [bookingsData, providersData] = await Promise.all([
        bookingService.getBookingsByProvider(user.id),
        providerService.getAllProviders(),
      ])
      setBookings(bookingsData)
      const provider = providersData.find((p) => p.userId === user.id) || null
      setProfile(provider)
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

  const jobsCompleted = bookings.filter((b) => b.status === 'COMPLETED').length
  const activeRequests = bookings.filter((b) => b.status === 'REQUESTED').length
  const rating = profile?.rating ?? 0
  const handleAvailabilityChange = (index: number, key: 'start' | 'end' | 'active', value: string | boolean) => {
    setWeeklyAvailability((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot)),
    )
  }

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="lg:w-80 space-y-4">
          <Card className="p-0 shadow-[0_10px_30px_rgba(16,24,40,0.06)]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="lg" />
                <div>
                  <p className="text-sm text-text-secondary">Provider</p>
                  <p className="text-lg font-semibold text-text-primary">{user.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F9FAFB] border border-border p-3">
                  <p className="text-xs text-text-secondary">Jobs</p>
                  <p className="text-lg font-semibold text-text-primary">{bookings.length}</p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] border border-border p-3">
                  <p className="text-xs text-text-secondary">Rating</p>
                  <p className="text-lg font-semibold text-text-primary">{rating.toFixed(1)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-[#F9FAFB] border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-text-secondary">Contact & Area</p>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <PhoneIcon size={16} color="#6B7280" />
                  <span>{(user as any).phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPinIcon size={16} color="#6B7280" />
                  <span>{user.city || 'No city set'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-[0_10px_30px_rgba(16,24,40,0.06)]">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <HeadphonesIcon size={20} color="#F97316" />
                <div>
                  <p className="text-body font-medium text-text-primary">Need Help?</p>
                  <p className="text-sm text-text-secondary">Contact Support</p>
                </div>
              </div>
              <Button className="w-full bg-[#0F172A] hover:bg-[#111827] text-white">
                Get Assistance
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[26px] font-semibold text-text-primary">Profile & Availability</h1>
              <p className="text-sm text-text-secondary">
                Manage your public info, service menu, and working hours.
              </p>
            </div>
          </div>

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
                      <Button size="sm" className="bg-[#5B2ECC] text-white" onClick={handleAddService}>
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
                            <Button size="sm" className="bg-[#5B2ECC] text-white" onClick={handleUpdateService}>
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
                                className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                                  svc.active ? 'bg-[#ECFDF3] text-[#22C55E]' : 'bg-[#F3F4F6] text-[#6B7280]'
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

          {/* Weekly schedule */}
          <Card className="border border-border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-text-primary">Weekly Schedule</p>
                  <p className="text-sm text-text-secondary">Upcoming accepted jobs</p>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 bg-[#F9FAFB] text-xs font-semibold text-text-secondary px-4 py-3">
                  <span>Day</span>
                  <span>Start</span>
                  <span>End</span>
                  <span>Status</span>
                </div>
                {weeklyAvailability.map((slot, index) => (
                  <div
                    key={slot.day}
                    className="grid grid-cols-4 items-center px-4 py-3 border-t border-border text-sm gap-2"
                  >
                    <span className="text-text-primary">{slot.day}</span>
                    <input
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={slot.start}
                      onChange={(e) => handleAvailabilityChange(index, 'start', e.target.value)}
                    />
                    <input
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                      value={slot.end}
                      onChange={(e) => handleAvailabilityChange(index, 'end', e.target.value)}
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={slot.active}
                        onChange={(e) => handleAvailabilityChange(index, 'active', e.target.checked)}
                      />
                      {slot.active ? 'Active' : 'Off'}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border">
              <CardContent className="p-4">
                <p className="text-xs text-text-secondary">New Requests</p>
                <p className="text-2xl font-semibold text-text-primary">{activeRequests}</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4">
                <p className="text-xs text-text-secondary">Completed</p>
                <p className="text-2xl font-semibold text-text-primary">{jobsCompleted}</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4">
                <p className="text-xs text-text-secondary">Total Jobs</p>
                <p className="text-2xl font-semibold text-text-primary">{bookings.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
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

  const menuItems = [
    { icon: MapPinIcon, label: 'Addresses', path: '/addresses', color: '#5B2D8B' },
    { icon: WalletIcon, label: 'Payments', path: '/payments', color: '#5B2D8B' },
    { icon: TagIcon, label: 'Coupons', path: '/coupons', color: '#5B2D8B' },
    { icon: HeadphonesIcon, label: 'Support', path: '/support', color: '#5B2D8B' },
  ]

  return (
    <div className="max-w-md mx-auto lg:max-w-full pb-24">
      {/* Profile Summary Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1">
              <h2 className="text-section-header font-heading text-text-primary mb-1">
                {user.name}
              </h2>
              <p className="text-body text-text-secondary">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon size={16} color="#6B7280" />
            <span className="text-body text-text-secondary">{(user as any).phone || 'Not provided'}</span>
          </div>
        </CardContent>
      </Card>

      {/* List Menu */}
      <div className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Card
              key={index}
              className="cursor-pointer transition-all hover:shadow-medium"
              onClick={() => {
                // Navigate to respective pages when implemented
                console.log(`Navigate to ${item.path}`)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Icon size={20} color={item.color} />
                  </div>
                  <span className="text-body font-label text-text-primary flex-1">
                    {item.label}
                  </span>
                  <ArrowRightIcon size={20} color="#9CA3AF" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Logout Button */}
      <div className="mt-6">
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOutIcon size={18} color="#DC2626" className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
