import { createContext, useContext, useState, ReactNode } from 'react';

interface LocationContextType {
  addressLocation: { lat: number; lng: number } | null;
  setAddressLocation: (location: { lat: number; lng: number } | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider = ({ children }: LocationProviderProps) => {
  const [addressLocation, setAddressLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <LocationContext.Provider value={{ addressLocation, setAddressLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};