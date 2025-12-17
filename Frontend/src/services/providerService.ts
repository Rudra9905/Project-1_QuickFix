// Import the API client for making HTTP requests
import { apiClient } from './apiClient'
// Import type definitions for provider-related data structures
import type {
  ProviderProfile,
  ProviderCreateRequest,
  AvailabilityUpdate,
  LocationUpdate,
  ServiceType,
  ServiceOffering,
  ServiceOfferingRequest,
} from '../types'

// Provider service object containing methods for provider-related API operations
export const providerService = {
  // Creates a new provider profile for a user
  // @param userId - The ID of the user creating the provider profile
  // @param data - Provider profile details (serviceType, description, basePrice, location, etc.)
  // @returns Promise that resolves to the created ProviderProfile object
  createProfile: async (
    userId: number,
    data: ProviderCreateRequest
  ): Promise<ProviderProfile> => {
    const response = await apiClient.post<ProviderProfile>(
      `/providers?userId=${userId}`,
      data
    )
    return response.data
  },

  // Retrieves all provider profiles, optionally filtered by city or distance
  // @param city - Optional city name to filter providers by location
  // @param userLat - Optional user latitude for distance-based filtering
  // @param userLng - Optional user longitude for distance-based filtering
  // @param maxDistanceKm - Optional maximum distance in kilometers
  // @returns Promise that resolves to an array of ProviderProfile objects
  getAllProviders: async (
    city?: string,
    userLat?: number,
    userLng?: number,
    maxDistanceKm?: number
  ): Promise<ProviderProfile[]> => {
    // Build URL with appropriate query parameters
    let url = '/providers';
    const params = new URLSearchParams();
    
    if (userLat !== undefined && userLng !== undefined && maxDistanceKm !== undefined) {
      console.log(`Adding distance parameters: lat=${userLat}, lng=${userLng}, maxDistance=${maxDistanceKm}`);
      // Use distance-based filtering
      params.append('userLat', userLat.toString());
      params.append('userLng', userLng.toString());
      params.append('maxDistanceKm', maxDistanceKm.toString());
    } else if (city) {
      console.log(`Adding city parameter: ${city}`);
      // Use city-based filtering
      params.append('city', city);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('Making GET request to:', url);
    const response = await apiClient.get<ProviderProfile[]>(url)
    console.log('Received response:', response.data);
    return response.data;
  },

  // Retrieves only available providers for a specific service type, 
  // optionally filtered by city or distance
  // @param serviceType - The type of service to search for (PLUMBER, ELECTRICIAN, etc.)
  // @param city - Optional city name to filter providers by location
  // @param userLat - Optional user latitude for distance-based filtering
  // @param userLng - Optional user longitude for distance-based filtering
  // @param maxDistanceKm - Optional maximum distance in kilometers
  // @returns Promise that resolves to an array of available ProviderProfile objects
  getAvailableProviders: async (
    serviceType: ServiceType,
    city?: string,
    userLat?: number,
    userLng?: number,
    maxDistanceKm?: number
  ): Promise<ProviderProfile[]> => {
    // Build URL with serviceType and appropriate query parameters
    let url = `/providers/available?serviceType=${serviceType}`;
    const params = new URLSearchParams();
    
    if (userLat !== undefined && userLng !== undefined && maxDistanceKm !== undefined) {
      console.log(`Adding distance parameters for available providers: lat=${userLat}, lng=${userLng}, maxDistance=${maxDistanceKm}`);
      // Use distance-based filtering
      params.append('userLat', userLat.toString());
      params.append('userLng', userLng.toString());
      params.append('maxDistanceKm', maxDistanceKm.toString());
    } else if (city) {
      console.log(`Adding city parameter for available providers: ${city}`);
      // Use city-based filtering
      params.append('city', city);
    }
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    console.log('Making GET request to:', url);
    const response = await apiClient.get<ProviderProfile[]>(url)
    console.log('Received response for available providers:', response.data);
    return response.data;
  },

  // Retrieves a specific provider profile by ID
  // @param id - The ID of the provider profile to fetch
  // @returns Promise that resolves to the ProviderProfile object
  getProviderById: async (id: number): Promise<ProviderProfile> => {
    const response = await apiClient.get<ProviderProfile>(`/providers/${id}`)
    return response.data
  },

  // Updates the availability status of a provider (available/unavailable)
  // @param id - The ID of the provider profile to update
  // @param data - Availability update data containing isAvailable boolean
  // @returns Promise that resolves to the updated ProviderProfile object
  updateAvailability: async (
    id: number,
    data: AvailabilityUpdate
  ): Promise<ProviderProfile> => {
    const response = await apiClient.put<ProviderProfile>(
      `/providers/${id}/availability`,
      data
    )
    return response.data
  },

  // Updates the location coordinates of a provider
  // @param id - The ID of the provider profile to update
  // @param data - Location update data containing latitude and longitude
  // @returns Promise that resolves to the updated ProviderProfile object
  updateLocation: async (
    id: number,
    data: LocationUpdate
  ): Promise<ProviderProfile> => {
    const response = await apiClient.put<ProviderProfile>(
      `/providers/${id}/location`,
      data
    )
    return response.data
  },

  // Lists service offerings for a provider
  listServices: async (providerId: number): Promise<ServiceOffering[]> => {
    const response = await apiClient.get<ServiceOffering[]>(`/providers/${providerId}/services`)
    return response.data
  },

  // Creates a new service offering for a provider
  addService: async (providerId: number, data: ServiceOfferingRequest): Promise<ServiceOffering> => {
    const response = await apiClient.post<ServiceOffering>(`/providers/${providerId}/services`, data)
    return response.data
  },

  // Updates an existing service offering
  updateService: async (
    providerId: number,
    serviceId: number,
    data: ServiceOfferingRequest,
  ): Promise<ServiceOffering> => {
    const response = await apiClient.put<ServiceOffering>(`/providers/${providerId}/services/${serviceId}`, data)
    return response.data
  },
}
