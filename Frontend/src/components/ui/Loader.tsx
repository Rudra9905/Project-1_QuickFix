export const Loader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
    </div>
  )
}

export const Skeleton = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = 'rounded',
}: {
  className?: string
  height?: string
  width?: string
  rounded?: string
}) => {
  return (
    <div
      className={`${height} ${width} ${rounded} bg-gray-200 animate-pulse ${className}`}
    />
  )
}

// Skeleton Components for different page types
export const DashboardSkeleton = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Greeting Section */}
      <div>
        <Skeleton height="h-4" width="w-32" className="mb-2" />
        <Skeleton height="h-8" width="w-64" />
      </div>

      {/* Booking Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl bg-card p-12 border border-slate-100 h-64">
            <div className="flex flex-col items-center justify-center gap-4">
              <Skeleton height="h-14" width="w-14" rounded="rounded-2xl" />
              <Skeleton height="h-6" width="w-32" className="mb-1" />
              <Skeleton height="h-4" width="w-48" />
              <Skeleton height="h-8" width="w-8" rounded="rounded-full" className="mt-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Service Card */}
      <Skeleton height="h-48" rounded="rounded-3xl" />
    </div>
  )
}

export const ProvidersSkeleton = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Skeleton height="h-9" width="w-48" />
        <Skeleton height="h-12" width="w-64" />
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Skeleton height="h-48" width="w-full" rounded="rounded-none" />
            <div className="p-6">
              <Skeleton height="h-6" width="w-32" className="mb-2" />
              <Skeleton height="h-4" width="w-24" className="mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton height="h-5" width="w-16" rounded="rounded-full" />
                <Skeleton height="h-5" width="w-20" rounded="rounded-full" />
              </div>
              <Skeleton height="h-4" width="w-full" className="mb-1" />
              <Skeleton height="h-4" width="w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const BookingsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height="h-9" width="w-48" />
        <div className="flex gap-2">
          <Skeleton height="h-10" width="w-24" rounded="rounded-lg" />
          <Skeleton height="h-10" width="w-24" rounded="rounded-lg" />
        </div>
      </div>

      {/* Booking Cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton height="h-6" width="w-40" className="mb-2" />
              <Skeleton height="h-4" width="w-32" />
            </div>
            <Skeleton height="h-6" width="w-20" rounded="rounded-full" />
          </div>
          <div className="space-y-2 mb-4">
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton height="h-10" width="w-24" rounded="rounded-lg" />
            <Skeleton height="h-10" width="w-24" rounded="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <Skeleton height="h-9" width="w-48" />
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-6 mb-6">
          <Skeleton height="h-24" width="w-24" rounded="rounded-full" />
          <div className="flex-1">
            <Skeleton height="h-6" width="w-40" className="mb-2" />
            <Skeleton height="h-4" width="w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton height="h-4" width="w-24" className="mb-2" />
              <Skeleton height="h-10" width="w-full" rounded="rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Additional Sections */}
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <Skeleton height="h-6" width="w-32" className="mb-4" />
          <div className="space-y-3">
            <Skeleton height="h-4" width="w-full" />
            <Skeleton height="h-4" width="w-5/6" />
            <Skeleton height="h-4" width="w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const SelectProviderSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton height="h-10" width="w-10" rounded="rounded-lg" />
        <Skeleton height="h-8" width="w-48" />
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton height="h-16" width="w-16" rounded="rounded-full" />
              <div className="flex-1">
                <Skeleton height="h-6" width="w-32" className="mb-2" />
                <Skeleton height="h-4" width="w-24" />
              </div>
            </div>
            <Skeleton height="h-4" width="w-full" className="mb-2" />
            <Skeleton height="h-4" width="w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const EarningsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton height="h-9" width="w-48" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton height="h-4" width="w-24" className="mb-2" />
            <Skeleton height="h-8" width="w-32" />
          </div>
        ))}
      </div>

      {/* Earnings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Skeleton height="h-6" width="w-32" className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex-1">
                <Skeleton height="h-4" width="w-32" className="mb-2" />
                <Skeleton height="h-3" width="w-24" />
              </div>
              <Skeleton height="h-5" width="w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ReviewsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton height="h-9" width="w-48" />

      {/* Review Cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton height="h-12" width="w-12" rounded="rounded-full" />
                <div>
                  <Skeleton height="h-5" width="w-32" className="mb-1" />
                  <Skeleton height="h-4" width="w-24" />
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} height="h-4" width="w-4" rounded="rounded" />
                ))}
              </div>
            </div>
            <Skeleton height="h-4" width="w-full" className="mb-2" />
            <Skeleton height="h-4" width="w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const TrackingPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton height="h-8" width="w-48" className="mb-4" />
            <Skeleton height="h-64" width="w-full" rounded="rounded-lg" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton height="h-6" width="w-32" className="mb-4" />
            <div className="space-y-3">
              <Skeleton height="h-4" width="w-full" />
              <Skeleton height="h-4" width="w-3/4" />
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Skeleton height="h-6" width="w-32" className="mb-4" />
            <div className="space-y-3">
              <Skeleton height="h-4" width="w-full" />
              <Skeleton height="h-4" width="w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const PageLoadingSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton height="h-8" width="w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Skeleton height="h-6" width="w-32" className="mb-3" />
              <Skeleton height="h-4" width="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ProviderDashboardSkeleton = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome & Stats Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Skeleton height="h-4" width="w-48" className="mb-2" />
            <Skeleton height="h-8" width="w-64" />
          </div>
          <div className="bg-card rounded-2xl p-4 border border-slate-100 shadow-sm min-w-[300px]">
            <Skeleton height="h-4" width="w-24" className="mb-2" />
            <Skeleton height="h-3" width="w-full" className="mb-3" />
            <Skeleton height="h-8" width="w-full" rounded="rounded-lg" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <Skeleton height="h-4" width="w-32" className="mb-2" />
              <Skeleton height="h-8" width="w-16" />
            </div>
            <Skeleton height="h-12" width="w-12" rounded="rounded-2xl" />
          </div>
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <Skeleton height="h-4" width="w-32" className="mb-2" />
              <Skeleton height="h-8" width="w-16" />
            </div>
            <Skeleton height="h-12" width="w-12" rounded="rounded-2xl" />
          </div>
          <div className="bg-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <Skeleton height="h-4" width="w-32" className="mb-2" />
              <Skeleton height="h-8" width="w-16" />
            </div>
            <Skeleton height="h-12" width="w-12" rounded="rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Combined Jobs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Available jobs section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Skeleton height="h-7" width="w-32" />
            <div className="flex gap-2">
              <Skeleton height="h-6" width="w-16" rounded="rounded-lg" />
              <Skeleton height="h-6" width="w-16" rounded="rounded-lg" />
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-3xl p-6 border shadow-sm relative overflow-hidden mb-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
                  <div className="flex gap-4 flex-1 min-w-0 pr-2">
                    <Skeleton height="h-14" width="w-14" rounded="rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton height="h-5" width="w-24" />
                        <Skeleton height="h-4" width="w-16" rounded="rounded-full" />
                      </div>
                      <Skeleton height="h-4" width="w-40" className="mb-3" />
                      <Skeleton height="h-12" width="w-full" rounded="rounded-xl" className="mb-3" />
                      <Skeleton height="h-4" width="w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4 min-w-[140px] shrink-0">
                    <div className="text-right">
                      <Skeleton height="h-6" width="w-20" />
                      <Skeleton height="h-4" width="w-16" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Skeleton height="h-10" width="w-20" rounded="rounded-xl" />
                      <Skeleton height="h-10" width="w-20" rounded="rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled / Upcoming Section */}
        <div>
          <Skeleton height="h-7" width="w-48" className="mb-6" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-3xl p-6 border shadow-sm relative overflow-hidden mb-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
                  <div className="flex gap-4 flex-1 min-w-0 pr-2">
                    <Skeleton height="h-14" width="w-14" rounded="rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton height="h-5" width="w-24" />
                        <Skeleton height="h-4" width="w-16" rounded="rounded-full" />
                      </div>
                      <Skeleton height="h-4" width="w-40" className="mb-3" />
                      <Skeleton height="h-12" width="w-full" rounded="rounded-xl" className="mb-3" />
                      <Skeleton height="h-4" width="w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4 min-w-[140px] shrink-0">
                    <div className="text-right">
                      <Skeleton height="h-6" width="w-20" />
                      <Skeleton height="h-4" width="w-16" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Skeleton height="h-10" width="w-20" rounded="rounded-xl" />
                      <Skeleton height="h-10" width="w-24" rounded="rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const PageSkeleton = ({ type }: { type?: 'dashboard' | 'providers' | 'bookings' | 'profile' | 'select-provider' | 'earnings' | 'reviews' | 'default' }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />
    case 'providers':
      return <ProvidersSkeleton />
    case 'bookings':
      return <BookingsSkeleton />
    case 'profile':
      return <ProfileSkeleton />
    case 'select-provider':
      return <SelectProviderSkeleton />
    case 'earnings':
      return <EarningsSkeleton />
    case 'reviews':
      return <ReviewsSkeleton />
    default:
      return (
        <div className="space-y-4">
          <Skeleton height="h-8" width="w-48" />
          <Skeleton height="h-4" width="w-full" />
          <Skeleton height="h-4" width="w-5/6" />
          <Skeleton height="h-4" width="w-4/6" />
        </div>
      )
  }
}
