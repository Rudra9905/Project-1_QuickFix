import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CalendarIcon } from '../components/icons/CustomIcons'

export const MultipleBookingDates = () => {
    const navigate = useNavigate()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const getMinDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    const handleNext = () => {
        if (!startDate || !endDate) return
        navigate('/select-provider', {
            state: {
                bookingType: 'multiple',
                startDate,
                endDate
            }
        })
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Back Button */}
            <div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back to Dashboard
                </button>
            </div>

            {/* Header Section */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-dark tracking-tight mb-2">
                    Select Dates
                </h1>
                <p className="text-sm text-text-muted">
                    Choose the date range for your multiple service booking.
                </p>
            </div>

            {/* Date Selection Card */}
            <div className="rounded-3xl bg-card p-8 shadow-sm border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">
                            Start Date
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon size={18} color="#6B7280" />
                            </div>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={getMinDate()}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">
                            End Date
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon size={18} color="#6B7280" />
                            </div>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || getMinDate()}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-8">
                    <div className="flex gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">info</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-dark mb-1">How it works</h4>
                            <p className="text-sm text-text-muted leading-relaxed">
                                You are creating a package booking. You will be able to select <strong className="text-text-dark">multiple providers</strong> in the next step.
                                A booking will be created for each day in the selected range for every provider you choose.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Find Providers Button */}
                <Button
                    className="w-full py-6 text-base font-medium rounded-xl"
                    onClick={handleNext}
                    disabled={!startDate || !endDate}
                >
                    Find Providers
                </Button>
            </div>
        </div>
    )
}
