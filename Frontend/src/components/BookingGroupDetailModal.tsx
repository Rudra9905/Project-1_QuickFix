import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { Booking, User } from '../types'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, ClockIcon } from './icons/CustomIcons'

interface BookingGroupDetailModalProps {
    isOpen: boolean
    onClose: () => void
    group: {
        id: string
        bookings: Booking[]
        user: User
        serviceType: string
        note?: string
    } | null
    onAcceptAll: (ids: number[]) => void
    onRejectAll: (ids: number[]) => void
    onStart: (id: number) => void
    onComplete: (id: number) => void
}

export const BookingGroupDetailModal = ({
    isOpen,
    onClose,
    group,
    onAcceptAll,
    onRejectAll,
    onStart,
    onComplete,
}: BookingGroupDetailModalProps) => {
    if (!group) return null

    const isPending = group.bookings.some(b => b.status === 'REQUESTED')
    const totalBookings = group.bookings.length

    // Sort bookings by date
    const sortedBookings = [...group.bookings].sort((a, b) => {
        const dateA = new Date(a.bookingDate || a.createdAt).getTime()
        const dateB = new Date(b.bookingDate || b.createdAt).getTime()
        return dateA - dateB
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold">Package Deal Details</span>
                            <Badge variant="default">{group.serviceType}</Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2 space-y-6">
                    {/* Customer Info */}
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {group.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{group.user.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <MapPinIcon size={16} />
                                <span>{group.user.city || 'Location not provided'}</span>
                            </div>
                            {group.note && (
                                <p className="text-sm text-gray-500 mt-2 bg-white p-2 rounded-lg border border-slate-100">
                                    "{group.note}"
                                </p>
                            )}
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-sm text-gray-500">Total Days</div>
                            <div className="text-2xl font-bold text-primary">{totalBookings}</div>
                        </div>
                    </div>

                    {/* Bookings List */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CalendarIcon size={18} />
                            Scheduled Dates
                        </h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {sortedBookings.map((booking, index) => (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {booking.bookingDate
                                                    ? format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy')
                                                    : 'Date pending'}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <ClockIcon size={12} />
                                                {booking.preferredTime || '09:00'} (Est. duration pending)
                                            </p>

                                        </div>
                                        <div className="flex gap-2">
                                            {booking.status === 'ACCEPTED' && (
                                                <Button size="sm" onClick={() => onStart(booking.id)}>
                                                    Start
                                                </Button>
                                            )}
                                            {booking.status === 'IN_PROGRESS' && (
                                                <Button size="sm" onClick={() => onComplete(booking.id)}>
                                                    Complete
                                                </Button>
                                            )}
                                            <Badge
                                                variant={
                                                    booking.status === 'ACCEPTED' ? 'success' :
                                                        booking.status === 'REJECTED' ? 'danger' :
                                                            booking.status === 'COMPLETED' ? 'default' :
                                                                booking.status === 'IN_PROGRESS' ? 'info' : 'default'
                                                }
                                            >
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {isPending && (
                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onRejectAll(group.bookings.map(b => b.id))}
                        >
                            Decline All
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => onAcceptAll(group.bookings.map(b => b.id))}
                        >
                            Accept Package ({totalBookings} Jobs)
                        </Button>
                    </div>
                )}

                {!isPending && (
                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    )
}
