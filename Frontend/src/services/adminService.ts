import { apiClient } from './apiClient'
import type { ProviderProfile } from '../types'

export const adminService = {
  listPendingProviders: async (): Promise<ProviderProfile[]> => {
    const response = await apiClient.get<ProviderProfile[]>('/admin/providers/pending')
    return response.data
  },
  getProvider: async (id: number): Promise<ProviderProfile> => {
    const response = await apiClient.get<ProviderProfile>(`/admin/providers/${id}`)
    return response.data
  },
  decideProvider: async (
    id: number,
    decision: 'APPROVE' | 'REJECT',
    rejectionReason?: string
  ): Promise<ProviderProfile> => {
    const response = await apiClient.post<ProviderProfile>(`/admin/providers/${id}/decision`, {
      decision,
      rejectionReason,
    })
    return response.data
  },
}
