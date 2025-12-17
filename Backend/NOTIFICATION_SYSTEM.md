# Quick Helper Real-Time Notification System

## Overview

The Quick Helper notification system provides real-time, persistent notifications for both users and service providers in an on-demand home service booking platform. The system ensures reliable delivery of critical booking-related events with both immediate real-time delivery via WebSocket and persistent storage for later retrieval.

## Architecture

### Backend Components

1. **Notification Model**
   - Supports both USER and PROVIDER roles
   - Persistent storage in database
   - Fields: id, receiverId, receiverRole, type, title, message, isRead, isHighPriority, relatedBookingId, createdAt

2. **Notification Repository**
   - Query methods for retrieving notifications by receiver and role
   - Methods for counting unread notifications

3. **Notification Service**
   - Core business logic for creating and managing notifications
   - WebSocket integration for real-time delivery
   - Fallback mechanisms for failed deliveries
   - Event-based notification triggers for booking workflows

4. **WebSocket Configuration**
   - JWT-secured WebSocket connections
   - STOMP protocol with SockJS fallback
   - Role-based topic subscriptions

5. **Security**
   - JWT token validation for WebSocket connections
   - Role-based access control

### Frontend Components

1. **WebSocket Service**
   - Robust connection handling with automatic reconnection
   - Exponential backoff for failed connections
   - Token-based authentication

2. **Notification Context**
   - Centralized state management for notifications
   - Polling fallback for WebSocket failures
   - Integration with React hooks

3. **Notification Bell Component**
   - Visual indicator with unread count badge
   - Dropdown panel with scrollable notification list
   - Timestamps and read/unread indicators
   - Mark as read and delete functionality

## Notification Flow

### 1. Creation and Storage
1. Notification is created in database with receiver information
2. Notification is marked as unread by default
3. Related booking ID is stored for context

### 2. Real-Time Delivery
1. WebSocket connection established with JWT token
2. Client subscribes to role-specific topic: `/topic/{role}/{id}/notifications`
3. Notification is immediately sent via WebSocket after creation
4. Fallback to database storage if WebSocket delivery fails

### 3. Frontend Handling
1. WebSocket message received and parsed
2. Notification added to local state
3. Unread count incremented
4. Toast notification displayed
5. UI updated in real-time

### 4. Persistence and Retrieval
1. Notifications stored in database for persistence
2. REST API endpoints for fetching notification history
3. Mark-as-read functionality
4. Cleanup of old notifications

## Supported Notification Events

### Provider Notifications
- New booking request received
- Booking cancelled by user
- Booking completed
- Earnings credited

### User Notifications
- Provider accepted booking
- Provider rejected booking
- Provider is on the way
- Service completed
- Payment successful

## Security Implementation

### JWT Authentication
- WebSocket connections secured with JWT tokens
- Token passed as query parameter during handshake
- Validation through custom handshake interceptor
- Role-based access control

### Data Protection
- Receiver role validation
- Proper error handling without exposing sensitive data
- Secure token generation and validation

## Fallback Mechanisms

### WebSocket Failures
- Automatic reconnection with exponential backoff
- Polling fallback when WebSocket is unavailable
- Database storage for failed real-time deliveries
- Graceful degradation to pull-based notifications

### Network Issues
- Retry mechanisms with backoff
- Timeout handling
- Connection state monitoring

## Performance Optimizations

### Backend
- Asynchronous WebSocket message sending
- Database indexing for notification queries
- Connection pooling
- Efficient serialization/deserialization

### Frontend
- Efficient React state management
- Virtualized lists for large notification sets
- Memoization of expensive operations
- Lazy loading of notification history

## API Endpoints

### REST API
```
GET    /api/notifications/{role}/{receiverId}           - Get all notifications
GET    /api/notifications/{role}/{receiverId}/unread    - Get unread notifications
GET    /api/notifications/{role}/{receiverId}/unread-count - Get unread count
PUT    /api/notifications/{notificationId}/read         - Mark notification as read
PUT    /api/notifications/{role}/{receiverId}/read-all  - Mark all as read
DELETE /api/notifications/{notificationId}              - Delete notification
```

### WebSocket Topics
```
/topic/user/{userId}/notifications     - User notifications
/topic/provider/{providerId}/notifications - Provider notifications
```

## Health Monitoring

### Endpoints
```
GET /api/health/notifications  - Notification system health
GET /api/health/websocket      - WebSocket system health
```

## Debugging and Logging

### Backend
- Comprehensive logging with SLF4J
- Debug levels: ERROR, WARN, INFO, DEBUG, TRACE
- Execution time measurement
- Retry mechanisms with logging

### Frontend
- Console logging with timestamps and levels
- Error boundaries
- Performance monitoring
- Debug utilities for development

## Testing

### Unit Tests
- Notification service logic
- WebSocket connection handling
- Security validation
- Error scenarios

### Integration Tests
- End-to-end notification flow
- WebSocket connectivity
- REST API endpoints
- Fallback mechanisms

## Deployment Considerations

### Scalability
- Horizontal scaling of notification service
- Load balancing for WebSocket connections
- Database optimization for high-volume scenarios

### Monitoring
- Connection metrics
- Delivery success rates
- Error tracking
- Performance dashboards

## Future Enhancements

1. Push notification support (mobile)
2. Email/SMS fallback for critical notifications
3. Notification templates and localization
4. Advanced filtering and categorization
5. Batch notification processing
6. Analytics and reporting