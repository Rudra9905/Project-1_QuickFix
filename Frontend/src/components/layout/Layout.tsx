import { ReactNode, useState, useEffect } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { BottomNavigation } from '../BottomNavigation'
import { EditLocationModal } from '../EditLocationModal'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import { providerService } from '../../services/providerService'
import toast from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

interface AddressDetails {
  street?: string
  area?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  fullAddress: string
}

export const Layout = ({ children, showBottomNav = true }: LayoutProps) => {
  const { user, updateUser } = useAuth()
  const [showAddressEditor, setShowAddressEditor] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<AddressDetails>({
    fullAddress: user?.city || ''
  })
  const [providerProfile, setProviderProfile] = useState<any>(null)

  useEffect(() => {
    setCurrentAddress({
      fullAddress: user?.city || ''
    })

    // If user is a provider, fetch their provider profile to get location data
    if (user?.role === 'PROVIDER') {
      fetchProviderProfile()
    }
  }, [user?.city, user?.id, user?.role])

  const fetchProviderProfile = async () => {
    // Avoid re-fetching if we already have the profile
    if (providerProfile) return

    try {
      const profile = await providerService.getProviderByUserId(user?.id!)
      if (profile) {
        setProviderProfile(profile)
      }
    } catch (error) {
      console.error('Failed to fetch provider profile:', error)
    }
  }

  const handleAddressSave = async (newAddress: string, lat: number, lng: number) => {
    if (!user) return;

    try {
      if (user.role === 'PROVIDER' && providerProfile) {
        // For providers, update both user city and provider location
        await Promise.all([
          userService.updateUserCity(user.id, newAddress),
          providerService.updateLocation(providerProfile.id, {
            locationLat: lat,
            locationLng: lng
          })
        ])

        // Update the auth context with the new user data
        updateUser({
          city: newAddress
        })

        // Update provider profile in state
        setProviderProfile({
          ...providerProfile,
          locationLat: lat,
          locationLng: lng
        })
      } else {
        // For regular users, only update user city
        await userService.updateUserCity(user.id, newAddress)

        // Update the auth context with the new user data
        updateUser({
          city: newAddress
        })
      }

      // Parse the full address to extract components
      const parsedAddress = parseFullAddress(newAddress)

      // Update local state
      setCurrentAddress(parsedAddress)
      setShowAddressEditor(false)
      toast.success('Location updated successfully!')
    } catch (error: any) {
      console.error('Failed to save address:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save address'
      toast.error(errorMessage)
    }
  }

  // Parse a full address string into components
  const parseFullAddress = (fullAddress: string): AddressDetails => {
    // This is a simple parser - in a real implementation, you might want to use
    // a more robust address parsing library

    const parts = fullAddress.split(',').map(part => part.trim())

    // Simple heuristic to extract address components
    const addressObj: AddressDetails = {
      fullAddress: fullAddress
    }

    if (parts.length >= 1) {
      // Try to identify components by common patterns
      // This is a simplified approach and may not work for all addresses

      // Look for pincode (typically numeric)
      const pincodeRegex = /\b\d{5,6}\b/
      const pincodeMatch = fullAddress.match(pincodeRegex)
      if (pincodeMatch) {
        addressObj.pincode = pincodeMatch[0]
      }

      // Assume last non-empty part is likely country
      if (parts.length > 0) {
        addressObj.country = parts[parts.length - 1]
      }

      // Assume second to last is likely state/province
      if (parts.length > 1) {
        addressObj.state = parts[parts.length - 2]
      }

      // Assume third to last is likely city
      if (parts.length > 2) {
        addressObj.city = parts[parts.length - 3]
      }

      // Area/neighborhood is often before city
      if (parts.length > 3) {
        addressObj.area = parts[parts.length - 4]
      }
    }

    return addressObj
  }

  // Format address for display in navbar
  const formatAddressForDisplay = (): string => {
    if (!currentAddress.fullAddress) {
      return 'Click to set address'
    }

    // Try to show a meaningful address portion with city, area, etc.
    const displayParts = []

    if (currentAddress.area) {
      displayParts.push(currentAddress.area)
    }

    if (currentAddress.city) {
      displayParts.push(currentAddress.city)
    } else if (currentAddress.state) {
      // Fallback to state if no city
      displayParts.push(currentAddress.state)
    }

    // Add pincode if available and we have other parts
    if (currentAddress.pincode && displayParts.length > 0) {
      displayParts.push(currentAddress.pincode)
    }

    // If we couldn't extract components, use the original approach
    if (displayParts.length === 0) {
      const parts = currentAddress.fullAddress.split(',').map(part => part.trim())

      // Show up to 3 parts for brevity in the navbar
      if (parts.length > 3) {
        return parts.slice(0, 3).join(', ')
      }

      return currentAddress.fullAddress
    }

    // Limit to 3 parts for navbar display
    if (displayParts.length > 3) {
      return displayParts.slice(0, 3).join(', ')
    }

    return displayParts.join(', ')
  }

  return (
    <div className="bg-surface font-display text-text-muted antialiased h-screen flex flex-col">
      <Navbar
        onEditAddress={() => setShowAddressEditor(true)}
        address={formatAddressForDisplay()}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-16 overflow-y-auto bg-surface p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
      {showBottomNav && <BottomNavigation />}
      <EditLocationModal
        isOpen={showAddressEditor}
        onClose={() => setShowAddressEditor(false)}
        currentAddress={currentAddress.fullAddress}
        onSave={handleAddressSave}
      />
    </div>
  )
}