import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { CalendarIcon, ClockIcon } from './icons/CustomIcons'
import type { ServiceType } from '../types'

// Modal for scheduling single or weekly service bookings with basic details
interface PrebookModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    bookingType: 'single' | 'weekly'
    serviceType: ServiceType
    date: string
    time?: string
    note?: string
  }) => void
  providerId?: number
  serviceType?: ServiceType
}

export const PrebookModal = ({
  isOpen,
  onClose,
  onConfirm,
  providerId,
  serviceType: initialServiceType,
}: PrebookModalProps) => {
  const [bookingType, setBookingType] = useState<'single' | 'weekly'>('single')
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | ''>(
    initialServiceType || ''
  )
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
    { value: 'PLUMBER', label: 'Plumber' },
    { value: 'ELECTRICIAN', label: 'Electrician' },
    { value: 'CLEANER', label: 'Cleaner' },
    { value: 'LAUNDRY', label: 'Laundry' },
    { value: 'OTHER', label: 'Other' },
  ]

  const handleSubmit = () => {
    if (!selectedServiceType || !date) {
      return
    }
    onConfirm({
      bookingType,
      serviceType: selectedServiceType as ServiceType,
      date,
      time: time || undefined,
      note: note || undefined,
    })
    // Reset form
    setBookingType('single')
    setDate('')
    setTime('')
    setNote('')
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getWeekDates = () => {
    if (!date) return []
    const startDate = new Date(date)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      dates.push(currentDate.toISOString().split('T')[0])
    }
    return dates
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prebook Service">
      <div className="space-y-4">
        <Select
          label="Booking Type"
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value as 'single' | 'weekly')}
          options={[
            { value: 'single', label: 'Single Booking' },
            { value: 'weekly', label: 'Weekly Booking (7 days)' },
          ]}
        />

        {!initialServiceType && (
          <Select
            label="Service Type"
            value={selectedServiceType}
            onChange={(e) =>
              setSelectedServiceType(e.target.value as ServiceType | '')
            }
            options={[
              { value: '', label: 'Select a service type' },
              ...SERVICE_TYPES,
            ]}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <CalendarIcon size={16} color="#9333EA" className="inline mr-2" />
            Start Date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={getMinDate()}
          />
        </div>

        {bookingType === 'single' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ClockIcon size={16} color="#9333EA" className="inline mr-2" />
              Preferred Time (Optional)
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        )}

        {bookingType === 'weekly' && date && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Weekly Schedule (7 days):
            </p>
            <div className="space-y-1">
              {getWeekDates().map((d, idx) => {
                const dateObj = new Date(d)
                return (
                  <div
                    key={idx}
                    className="text-xs text-gray-600 flex items-center gap-2"
                  >
                    <span className="font-medium">
                      {dateObj.toLocaleDateString('en-US', {
                        weekday: 'short',
                      })}
                    </span>
                    <span>{dateObj.toLocaleDateString('en-US')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Textarea
          label="Additional Notes (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any special requirements or notes..."
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedServiceType || !date}
          >
            {bookingType === 'single' ? 'Book Now' : 'Book Weekly'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
