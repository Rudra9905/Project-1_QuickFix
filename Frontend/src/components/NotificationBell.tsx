import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext'

// Converts a timestamp into a short "time ago" label for display
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// Map notification types to icons and colors for list rendering
const getNotificationConfig = (type: string, isHighPriority: boolean, isRead: boolean) => {
  const configMap: Record<string, { icon: string; bgColor: string; borderColor: string }> = {
    NEW_BOOKING_REQUEST: { 
      icon: '🛎️', 
      bgColor: isRead ? 'bg-yellow-50' : 'bg-yellow-100',
      borderColor: isRead ? 'border-yellow-200' : 'border-yellow-300'
    },
    BOOKING_ACCEPTED: { 
      icon: '✅', 
      bgColor: isRead ? 'bg-green-50' : 'bg-green-100',
      borderColor: isRead ? 'border-green-200' : 'border-green-300'
    },
    BOOKING_REJECTED: { 
      icon: '❌', 
      bgColor: isRead ? 'bg-red-50' : 'bg-red-100',
      borderColor: isRead ? 'border-red-200' : 'border-red-300'
    },
    PROVIDER_ON_WAY: { 
      icon: '🚗', 
      bgColor: isRead ? 'bg-blue-50' : 'bg-blue-100',
      borderColor: isRead ? 'border-blue-200' : 'border-blue-300'
    },
    SERVICE_STARTED: { 
      icon: '🔧', 
      bgColor: isRead ? 'bg-purple-50' : 'bg-purple-100',
      borderColor: isRead ? 'border-purple-200' : 'border-purple-300'
    },
    SERVICE_COMPLETED: { 
      icon: '🎉', 
      bgColor: isRead ? 'bg-green-50' : 'bg-green-100',
      borderColor: isRead ? 'border-green-200' : 'border-green-300'
    },
    PAYMENT_CONFIRMED: { 
      icon: '💰', 
      bgColor: isRead ? 'bg-green-50' : 'bg-green-100',
      borderColor: isRead ? 'border-green-200' : 'border-green-300'
    },
    JOB_COMPLETED: { 
      icon: '💼', 
      bgColor: isRead ? 'bg-indigo-50' : 'bg-indigo-100',
      borderColor: isRead ? 'border-indigo-200' : 'border-indigo-300'
    },
    EARNINGS_CREDITED: { 
      icon: '💵', 
      bgColor: isRead ? 'bg-green-50' : 'bg-green-100',
      borderColor: isRead ? 'border-green-200' : 'border-green-300'
    },
    BOOKING_CANCELLED: { 
      icon: '🚫', 
      bgColor: isRead ? 'bg-red-50' : 'bg-red-100',
      borderColor: isRead ? 'border-red-200' : 'border-red-300'
    },
    RATING_REMINDER: { 
      icon: '⭐', 
      bgColor: isRead ? 'bg-yellow-50' : 'bg-yellow-100',
      borderColor: isRead ? 'border-yellow-200' : 'border-yellow-300'
    },
    default: { 
      icon: '🔔', 
      bgColor: isRead ? 'bg-gray-50' : 'bg-gray-100',
      borderColor: isRead ? 'border-gray-200' : 'border-gray-300'
    }
  }

  // Override for high priority notifications
  if (isHighPriority && !isRead) {
    return {
      icon: configMap[type]?.icon || '🔔',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300'
    }
  }

  return configMap[type] || configMap.default
}

// Notification bell dropdown showing unread count and list with actions
export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notificationId: number) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification && !notification.isRead) {
      await markAsRead(notificationId)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-text-muted hover:text-primary transition-colors">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-[#EFEAFF] z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#EFEAFF]">
            <h3 className="text-lg font-semibold text-[#0F172A]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs border border-primary text-primary hover:bg-primary/10 px-2 py-1 rounded"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notifications"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-400 mx-auto mb-2 opacity-50">notifications</span>
                <p className="text-[#64748B]">No notifications</p>
                <p className="text-sm text-[#94A3B8] mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EFEAFF]">
                {notifications.map((notification) => {
                  const config = getNotificationConfig(
                    notification.type,
                    notification.isHighPriority,
                    notification.isRead
                  )
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-[#F6F4FF] transition-colors border-l-4 ${config.borderColor} ${config.bgColor}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">
                              {config.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4
                                  className={`text-sm font-medium ${
                                    notification.isRead ? 'text-[#64748B]' : 'text-[#0F172A] font-semibold'
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-[#5A00F0] rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p
                                className={`text-sm ${
                                  notification.isRead ? 'text-[#94A3B8]' : 'text-[#0F172A]'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-[#94A3B8] mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Delete notification"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t border-[#EFEAFF] bg-[#F6F4FF] text-xs text-[#64748B] rounded-b-2xl">
              {unreadCount > 0 ? (
                <span>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
              ) : (
                <span>All notifications read</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}