import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { reviewService } from '../services/reviewService'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Review, Booking } from '../types'
import { StarIcon, MessageSquareIcon } from '../components/icons/CustomIcons'

export const Reviews = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (user?.role === 'PROVIDER') {
      fetchReviews()
    } else {
      fetchCompletedBookings()
    }
  }, [user])

  const fetchReviews = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await reviewService.getReviewsByProvider(user.id)
      setReviews(data)
    } catch (error) {
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompletedBookings = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const bookings = await bookingService.getBookingsByUser(user.id)
      const completed = bookings.filter((b) => b.status === 'COMPLETED')
      setCompletedBookings(completed)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedBooking) return

    try {
      await reviewService.createReview({
        bookingId: selectedBooking.id,
        rating,
        comment: comment || undefined,
      })
      toast.success('Review submitted successfully!')
      setIsModalOpen(false)
      setSelectedBooking(null)
      setRating(5)
      setComment('')
      fetchCompletedBookings()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (user?.role === 'PROVIDER') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reviews</h1>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
            <MessageSquareIcon size={48} color="#9CA3AF" className="mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={20}
                          color={i < review.rating ? '#FCD34D' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      {review.comment && (
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Leave a Review</h1>
      </div>

      {completedBookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquareIcon size={48} color="#9CA3AF" className="mx-auto mb-4" />
            <p className="text-gray-500">No completed bookings to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Service: {booking.serviceType}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Provider: {booking.provider.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Completed: {new Date(booking.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedBooking(booking)
                      setIsModalOpen(true)
                    }}
                  >
                    Write Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
          setRating(5)
          setComment('')
        }}
        title="Write a Review"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <StarIcon
                      size={32}
                      color={star <= rating ? '#FCD34D' : '#D1D5DB'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              label="Comment (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedBooking(null)
                  setRating(5)
                  setComment('')
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
