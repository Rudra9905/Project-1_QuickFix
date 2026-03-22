import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { chatService, ChatMessage } from '../services/chatService'
import { websocketService } from '../services/websocketService'
import { format } from 'date-fns'

interface ChatWindowProps {
    recipientId: number
    recipientName: string
    onClose: () => void
}

export const ChatWindow = ({ recipientId, recipientName, onClose }: ChatWindowProps) => {
    const { user } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const subscriptionRef = useRef<any>(null)
    const connectionCheckIntervalRef = useRef<any>(null)
    const userRef = useRef<number | null>(null)
    const recipientIdRef = useRef<number | null>(null)

    // Store current user and recipient IDs in refs to avoid stale closures
    useEffect(() => {
        if (user) userRef.current = user.id
        recipientIdRef.current = recipientId
    }, [user, recipientId])

    // Create a stable message handler that uses refs to always get current values
    const messageHandler = useCallback((message: ChatMessage) => {
        console.log('ChatWindow received message:', message);
        
        const currentUserId = userRef.current
        const currentRecipientId = recipientIdRef.current
        
        if (!currentUserId || !currentRecipientId) {
            console.warn('Missing user or recipient ID, ignoring message');
            return;
        }
        
        // Ensure IDs are compared as numbers
        const msgSenderId = Number(message.senderId);
        const msgReceiverId = Number(message.receiverId);
        const userId = Number(currentUserId);
        const recipientIdNum = Number(currentRecipientId);

        const isFromMe = msgSenderId === userId && msgReceiverId === recipientIdNum;
        const isToMe = msgSenderId === recipientIdNum && msgReceiverId === userId;
        const isMyConversation = isFromMe || isToMe;
        
        console.log(`Message analysis: isFromMe=${isFromMe}, isToMe=${isToMe}, isMyConversation=${isMyConversation}`);
        console.log(`IDs: User=${userId}, Recipient=${recipientIdNum}, MsgSender=${msgSenderId}, MsgReceiver=${msgReceiverId}`);

        if (isMyConversation) {
            setMessages(prev => {
                console.log('Updating messages state with new message');
                
                // If message has an ID, check for duplicates by ID
                if (message.id) {
                    const existingIndex = prev.findIndex(msg => msg.id === message.id);
                    if (existingIndex !== -1) {
                        console.log('Duplicate message detected by ID, skipping');
                        return prev;
                    }
                    
                    // Replace optimistic message (no ID) with real message (has ID) if content matches
                    const optimisticIndex = prev.findIndex(msg => 
                        !msg.id && 
                        msg.content === message.content &&
                        msg.senderId === message.senderId &&
                        msg.receiverId === message.receiverId
                    );
                    
                    if (optimisticIndex !== -1) {
                        console.log('Replacing optimistic message with real message');
                        const newMessages = [...prev];
                        newMessages[optimisticIndex] = message;
                        return newMessages;
                    }
                } else {
                    // If no ID, check for duplicates by content and timestamp
                    const contentExists = prev.some(msg =>
                        msg.content === message.content &&
                        msg.senderId === message.senderId &&
                        msg.receiverId === message.receiverId &&
                        msg.timestamp === message.timestamp
                    );
                    if (contentExists) {
                        console.log('Duplicate message detected by content/timestamp, skipping');
                        return prev;
                    }
                }
                
                console.log('Adding new message to state');
                return [...prev, message];
            });
            // Scroll to bottom
            scrollToBottom()
        } else {
            console.log('Message not for this conversation, ignoring');
        }
    }, []);

    // Function to setup chat subscription
    const setupChatSubscription = useCallback(() => {
        if (!user) {
            console.warn('Cannot setup subscription: no user');
            return;
        }
        
        console.log('Setting up chat subscription for recipient:', recipientId);
        
        // Unsubscribe from previous subscription if exists
        if (subscriptionRef.current) {
            console.log('Unsubscribing from previous chat subscription');
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }

        // Subscribe to incoming messages with the stable handler
        subscriptionRef.current = websocketService.subscribeToChat(messageHandler);
        console.log('Chat subscription established successfully');
    }, [user, recipientId, messageHandler]);

    useEffect(() => {
        if (!user) return

        // Load chat history
        loadHistory()

        // Ensure WebSocket connection is established for this user
        websocketService.ensureConnection(user.id, user.role);

        // Check if WebSocket is already connected
        const checkConnection = () => {
            const status = websocketService.getConnectionStatus();
            const currentUserId = Number(user.id);
            // Handle null userId - if connected but userId is null/0, still allow subscription
            // because the connection might be in progress
            const statusUserId = status.userId ? Number(status.userId) : null;

            console.log(`[ChatWindow] Connection Check: Connected=${status.isConnected}, ServiceUser=${statusUserId}, CurrentUser=${currentUserId}`);

            // If connected and userId matches, or if connected but userId is null (connection in progress)
            if (status.isConnected) {
                if (statusUserId === null || statusUserId === currentUserId) {
                    return true;
                }
            }
            return false;
        };

        // Setup subscription immediately if connected, otherwise wait for connection
        const setupSubscriptionIfConnected = () => {
            const status = websocketService.getConnectionStatus();
            const currentUserId = Number(user.id);
            const statusUserId = status.userId ? Number(status.userId) : null;
            
            // Only setup if connected AND (userId matches OR userId is null/0 meaning connection just started)
            if (status.isConnected) {
                if (statusUserId === null || statusUserId === 0) {
                    // Connection is established but userId might not be set yet
                    // This can happen if ensureConnection was just called
                    console.log('[ChatWindow] Connection established but userId not set yet, will retry');
                    return false;
                }
                if (statusUserId === currentUserId) {
                    console.log('[ChatWindow] WebSocket connected with matching userId, setting up subscription');
                    setupChatSubscription();
                    return true;
                } else {
                    console.warn(`[ChatWindow] Connected but userId mismatch: ${statusUserId} !== ${currentUserId}`);
                    return false;
                }
            }
            return false;
        };

        // Try to setup immediately
        if (!setupSubscriptionIfConnected()) {
            console.log('[ChatWindow] WebSocket not ready, waiting for connection...');
            
            // Clear any existing interval
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
            }

            // Try to ensure connection by checking periodically (more aggressive)
            let attempts = 0;
            const maxAttempts = 40; // 20 seconds max wait (increased to handle async connection)
            connectionCheckIntervalRef.current = setInterval(() => {
                attempts++;
                if (setupSubscriptionIfConnected()) {
                    console.log(`[ChatWindow] Subscription setup completed after ${attempts} attempts`);
                    clearInterval(connectionCheckIntervalRef.current!);
                    connectionCheckIntervalRef.current = null;
                } else if (attempts >= maxAttempts) {
                    console.warn(`[ChatWindow] Subscription setup timed out after ${attempts} attempts`);
                    // Try one more time with force
                    const status = websocketService.getConnectionStatus();
                    if (status.isConnected) {
                        console.log('[ChatWindow] Force setting up subscription despite timeout');
                        setupChatSubscription();
                    }
                    clearInterval(connectionCheckIntervalRef.current!);
                    connectionCheckIntervalRef.current = null;
                }
            }, 500);
        }

        // Monitor connection status and re-subscribe if connection is restored
        // This handles cases where connection drops and comes back
        const connectionMonitor = setInterval(() => {
            const isConnected = checkConnection();
            const hasSubscription = !!subscriptionRef.current;
            
            if (isConnected && !hasSubscription) {
                console.log('[ChatWindow] Connection restored but subscription missing, re-establishing');
                setupChatSubscription();
            } else if (!isConnected && hasSubscription) {
                console.log('[ChatWindow] Connection lost, will re-subscribe when restored');
                // Don't unsubscribe here, let the WebSocket service handle reconnection
            }
        }, 2000);

        return () => {
            if (connectionCheckIntervalRef.current) {
                clearInterval(connectionCheckIntervalRef.current);
                connectionCheckIntervalRef.current = null;
            }
            clearInterval(connectionMonitor);
            if (subscriptionRef.current) {
                console.log('Cleaning up chat subscription');
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        }
    }, [user, recipientId, setupChatSubscription])

    const loadHistory = async () => {
        if (!user) return
        try {
            setIsLoading(true)
            const data = await chatService.getChatHistory(user.id, recipientId)
            // History comes in desc order (newest first), so reverse for display
            setMessages([...data.content].reverse())
            scrollToBottom()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSend = () => {
        if (!user || (!newMessage.trim() && !isUploading)) return

        const msg: ChatMessage = {
            senderId: user.id,
            receiverId: recipientId,
            content: newMessage,
            timestamp: new Date().toISOString()
        }

        // Send via WebSocket
        websocketService.sendChat(msg)

        // Optimistic update
        setMessages(prev => [...prev, msg])
        setNewMessage('')
        scrollToBottom()
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        try {
            setIsUploading(true)
            const { url } = await chatService.uploadMedia(file)
            
            // Send message with image URL
            const msg: ChatMessage = {
                senderId: user.id,
                receiverId: recipientId,
                content: 'Sent an image',
                imageUrl: url,
                timestamp: new Date().toISOString()
            }
            
            websocketService.sendChat(msg)
            setMessages(prev => [...prev, msg])
            scrollToBottom()
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Failed to upload image')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[1000] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/5 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-bold text-gray-800">{recipientName}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-gray-500 text-lg">close</span>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${i % 2 === 0 ? 'bg-primary/20' : 'bg-gray-200'}`}>
                          <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                          <div className="h-2 bg-gray-300 rounded animate-pulse w-16 mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.id
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                ? 'bg-primary !text-white rounded-br-none shadow-md'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                {msg.imageUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                        <img 
                                            src={msg.imageUrl} 
                                            alt="Shared media" 
                                            className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.imageUrl, '_blank')}
                                        />
                                    </div>
                                )}
                                <p className={isMe ? 'text-white font-medium' : ''}>{msg.content}</p>
                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                    {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'Sending...'}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-30"
                        title="Upload Image"
                    >
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-2xl">image</span>
                        )}
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !isUploading}
                        className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center min-w-[40px]"
                    >
                        <span className="material-symbols-outlined text-xl !text-white">send</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
