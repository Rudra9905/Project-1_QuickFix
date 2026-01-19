import { apiClient } from './apiClient'

export interface ChatMessage {
    id?: number
    senderId: number
    receiverId: number
    content: string
    timestamp?: string
    isRead?: boolean
    bookingId?: number
}

export const chatService = {
    getChatHistory: async (userId1: number, userId2: number, page: number = 0, size: number = 20) => {
        const response = await apiClient.get<any>(`/chat/history/${userId1}/${userId2}?page=${page}&size=${size}`)
        return response.data
    },

    getUnreadCount: async (userId: number) => {
        const response = await apiClient.get<number>(`/chat/unread/${userId}`)
        return response.data
    }
}
