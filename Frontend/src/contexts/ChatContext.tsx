import { createContext, useContext, useState, ReactNode } from 'react'

interface ChatContextType {
    isOpen: boolean
    recipientId: number | null
    recipientName: string
    openChat: (recipientId: number, recipientName: string) => void
    closeChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [recipientId, setRecipientId] = useState<number | null>(null)
    const [recipientName, setRecipientName] = useState('')

    const openChat = (id: number, name: string) => {
        setRecipientId(id)
        setRecipientName(name)
        setIsOpen(true)
    }

    const closeChat = () => {
        setIsOpen(false)
        setRecipientId(null)
    }

    return (
        <ChatContext.Provider value={{ isOpen, recipientId, recipientName, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => {
    const context = useContext(ChatContext)
    if (!context) throw new Error('useChat must be used within a ChatProvider')
    return context
}
