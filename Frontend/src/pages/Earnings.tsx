import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader } from '../components/ui/Loader'
import { bookingService } from '../services/bookingService'
import { providerService } from '../services/providerService'
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns'
import type { Booking } from '../types'
import {
  TrendingUpIcon,
  CalendarIcon,
  WalletIcon
} from '../components/icons/CustomIcons'

interface EarningsSummary {
  totalEarnings: number
  todayEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
  totalJobs: number
  completedJobs: number
  avgEarningsPerJob: number
}

// Helper function to extract price from booking note
const extractPriceFromNote = (note?: string): number | null => {
  if (!note) return null
  // Match patterns like "₹500" or "- ₹500/" in the note
  const match = note.match(/₹(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

const Earnings = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalJobs: 0,
    completedJobs: 0,
    avgEarningsPerJob: 0
  })

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Fetch bookings and provider profile in parallel
      const [bookingsData, providersData] = await Promise.all([
        bookingService.getBookingsByProvider(user!.id),
        providerService.getAllProviders()
      ])

      const currentProvider = providersData.find(p => p.userId === user!.id)
      const basePrice = currentProvider?.basePrice || 0

      setBookings(bookingsData)
      calculateEarningsSummary(bookingsData, basePrice)
    } catch (error) {
      console.error('Failed to fetch earnings data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateEarningsSummary = (bookingsData: Booking[], fallbackPrice: number) => {
    const completedBookings = bookingsData.filter(b => b.status === 'COMPLETED')

    // Calculate earnings based on actual booking prices from notes
    const calculateEarnings = (bookings: Booking[]) => {
      return bookings.reduce((total, booking) => {
        const price = extractPriceFromNote(booking.note) || fallbackPrice
        return total + price
      }, 0)
    }

    const todayEarnings = calculateEarnings(
      completedBookings.filter(b => b.completedAt && isToday(parseISO(b.completedAt)))
    )

    const weeklyEarnings = calculateEarnings(
      completedBookings.filter(b => b.completedAt && isThisWeek(parseISO(b.completedAt)))
    )

    const monthlyEarnings = calculateEarnings(
      completedBookings.filter(b => b.completedAt && isThisMonth(parseISO(b.completedAt)))
    )

    const totalEarnings = calculateEarnings(completedBookings)
    const avgEarningsPerJob = completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0

    setBasePrice(fallbackPrice)
    setEarningsSummary({
      totalEarnings,
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalJobs: bookingsData.length,
      completedJobs: completedBookings.length,
      avgEarningsPerJob
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  const recentEarnings = bookings
    .filter(b => b.status === 'COMPLETED' && b.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight mb-2">
          Earnings Dashboard
        </h1>
        <p className="text-text-muted">
          Track your income, completed jobs, and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Total Earnings</p>
            <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.totalEarnings.toLocaleString()}</h3>
          </div>
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <WalletIcon size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-teal/30 transition-all">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">Today</p>
            <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.todayEarnings.toLocaleString()}</h3>
          </div>
          <div className="size-12 rounded-2xl bg-accent-teal/10 flex items-center justify-center text-accent-teal group-hover:scale-110 transition-transform">
            <CalendarIcon size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-orange/30 transition-all">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">This Week</p>
            <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.weeklyEarnings.toLocaleString()}</h3>
          </div>
          <div className="size-12 rounded-2xl bg-accent-orange/10 flex items-center justify-center text-accent-orange group-hover:scale-110 transition-transform">
            <TrendingUpIcon size={24} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-accent-navy/30 transition-all">
          <div>
            <p className="text-sm font-medium text-text-muted mb-1">This Month</p>
            <h3 className="text-2xl font-bold text-text-dark">₹{earningsSummary.monthlyEarnings.toLocaleString()}</h3>
          </div>
          <div className="size-12 rounded-2xl bg-accent-navy/10 flex items-center justify-center text-accent-navy group-hover:scale-110 transition-transform">
            <TrendingUpIcon size={24} />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUpIcon size={20} />
            </div>
            <h3 className="font-semibold text-text-dark">Performance</h3>
          </div>          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Total Jobs</p>
              <p className="text-xl font-bold text-text-dark">{earningsSummary.totalJobs}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Completed Jobs</p>
              <p className="text-xl font-bold text-text-dark">{earningsSummary.completedJobs}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Completion Rate</p>
              <p className="text-xl font-bold text-text-dark">
                {earningsSummary.totalJobs > 0
                  ? Math.round((earningsSummary.completedJobs / earningsSummary.totalJobs) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                <WalletIcon size={20} />
              </div>
              <h3 className="font-semibold text-text-dark">Earnings Overview</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Avg. Earnings per Job</p>
              <p className="text-xl font-bold text-text-dark">₹{earningsSummary.avgEarningsPerJob.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Top Performing Period</p>
              <p className="text-xl font-bold text-text-dark">
                {earningsSummary.todayEarnings > earningsSummary.weeklyEarnings && earningsSummary.todayEarnings > earningsSummary.monthlyEarnings
                  ? "Today"
                  : earningsSummary.weeklyEarnings > earningsSummary.monthlyEarnings
                    ? "This Week"
                    : "This Month"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Earnings */}
      <div className="bg-card rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-text-dark mb-4">Recent Completed Jobs</h3>
        {recentEarnings.length > 0 ? (
          <div className="space-y-4">
            {recentEarnings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-text-dark">
                    {booking.serviceType.charAt(0) + booking.serviceType.slice(1).toLowerCase()}
                  </p>
                  <p className="text-sm text-text-muted">
                    Completed on {booking.completedAt ? format(parseISO(booking.completedAt), 'MMM d, yyyy') : 'Unknown date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-dark">₹{extractPriceFromNote(booking.note) || basePrice}</p>
                  <p className="text-sm text-success">+ ₹{extractPriceFromNote(booking.note) || basePrice} earned</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <WalletIcon size={24} className="text-primary" />
            </div>
            <h4 className="font-medium text-text-dark mb-1">No completed jobs yet</h4>
            <p className="text-sm text-text-muted">
              Your earnings will appear here once you complete jobs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Earnings