import { useChat } from '../contexts/ChatContext'
import { ChatWindow } from './ChatWindow'

export const ChatOverlay = () => {
    const { isOpen, recipientId, recipientName, closeChat } = useChat()

    if (!isOpen || !recipientId) return null

    return (
        <ChatWindow
            recipientId={recipientId}
            recipientName={recipientName}
            onClose={closeChat}
        />
    )
}
