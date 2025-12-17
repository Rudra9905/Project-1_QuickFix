import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { MapPinIcon, EditIcon } from './icons/CustomIcons'
import { EditLocationModal } from './EditLocationModal'

// Displays current address and lets the user open a modal to edit/location pick
interface AddressSelectorProps {
  address: string
  onAddressChange: (address: string) => void
  onLocationChange?: (lat: number, lng: number) => void
}

export const AddressSelector = ({
  address,
  onAddressChange,
  onLocationChange,
}: AddressSelectorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Save handler forwarded to parent and optional location update
  const handleSave = async (newAddress: string, lat: number, lng: number) => {
    onAddressChange(newAddress)
    if (onLocationChange) {
      onLocationChange(lat, lng)
    }
  }

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPinIcon size={20} color="#9333EA" />
            <h3 className="font-semibold text-gray-900">Select Your Address</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Current Address</p>
                <p className="text-gray-900 font-medium">
                  {address || 'No address selected'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <EditIcon size={16} color="#9333EA" />
              Edit Location
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentAddress={address}
        onSave={handleSave}
      />
    </>
  )
}
