# Product Requirements Document (PRD): Quick Helper

## 1. Project Overview
Quick Helper is an on-demand service booking platform designed to connect customers with local service providers (e.g., plumbers, electricians, cleaners). It streamlines the process of finding, booking, and paying for household services. Additionally, it features an AI-driven issue diagnostic tool that allows users to upload photos of a problem and get automatic recommendations for the right service type and available providers.

## 2. User Personas

### 2.1 Customer (User)
- **Goal:** Quickly find reliable, available service providers to fix household issues.
- **Pain Points:** Unsure of what specific service is needed for a problem. Difficulty finding trusted providers quickly.
- **Key Actions:** Upload photos for AI diagnosis, search providers, book services, chat with providers, pay for services, leave reviews.

### 2.2 Service Provider
- **Goal:** Earn money by accepting service requests in their specialized domain.
- **Pain Points:** Finding consistent work, managing schedules, and securing payments safely.
- **Key Actions:** Create a profile, set availability/location, accept/reject booking requests, chat with customers, receive payouts.

### 2.3 Administrator
- **Goal:** Maintain platform quality, safety, and resolve disputes.
- **Key Actions:** Approve or reject provider profiles, monitor platform statistics.

---

## 3. Key Features

### 3.1 Authentication & Authorization
- Role-based Access Control (User, Provider, Admin).
- JWT-based authentication for secure session management.

### 3.2 AI-Powered Issue Diagnosis
- Integration with Gemini AI to analyze images uploaded by users.
- Automatically determines the issue description and corresponding `ServiceType` (e.g., PLUMBER, ELECTRICIAN).
- Recommends nearby available providers matching the service type.

### 3.3 Provider Discovery & Booking
- Location-based provider search.
- Booking flow: Request → Provider Accept/Reject → Completion.
- Real-time status updates.

### 3.4 Chat & Notifications
- Real-time messaging between Customers and Providers using WebSockets (STOMP).
- In-app notifications for booking state changes.

### 3.5 Payments
- Stripe integration for handling customer payments (PaymentIntents).
- Stripe Connect for onboarding providers and routing payouts securely.

### 3.6 Media & File Storage
- Cloudinary integration for handling profile pictures, resumes, demo videos, and problem images.

---

## 4. System Architecture

The application follows a standard modern web architecture with a decoupled React frontend and a Spring Boot backend, utilizing a PostgreSQL database and third-party APIs.

```mermaid
graph TD
    %% Frontend
    subgraph Client [Frontend Layer - React/Vite]
        UI[User Interface]
        State[React Context / State]
        API_Client[Axios REST Client]
        WS_Client[STOMP WebSocket]
    end

    %% Backend
    subgraph Backend [Backend Layer - Spring Boot]
        Controllers[REST Controllers]
        Security[Spring Security / JWT]
        Services[Business Logic Services]
        WS_Handler[WebSocket / STOMP Handler]
        Data_Access[Spring Data JPA Repositories]
    end

    %% Database & Cache
    subgraph Storage [Data Layer]
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
    end

    %% Third Parties
    subgraph External Services
        Stripe[Stripe API - Payments]
        Gemini[Gemini API - AI Diagnosis]
        Cloudinary[Cloudinary - File Storage]
    end

    %% Connections
    UI <--> State
    State <--> API_Client
    State <--> WS_Client

    API_Client -->|REST HTTP| Controllers
    WS_Client <-->|WebSocket| WS_Handler
    
    Controllers <--> Security
    Controllers <--> Services
    WS_Handler <--> Services

    Services <--> Data_Access
    Data_Access <--> DB
    Services <--> Cache

    Services <-->|Image Analysis| Gemini
    Services <-->|Process Payments| Stripe
    Services <-->|Upload Media| Cloudinary
```

---

## 5. Database Schema (Entity-Relationship)

The following ER Diagram illustrates the core entities and their relationships within the PostgreSQL database.

```mermaid
erDiagram
    USER ||--o{ BOOKING : requests
    USER ||--o| PROVIDER_PROFILE : "has (if role=PROVIDER)"
    USER ||--o{ REVIEW : writes
    USER ||--o{ CHAT_MESSAGE : sends
    
    PROVIDER_PROFILE ||--o{ BOOKING : accepts
    PROVIDER_PROFILE ||--o{ SERVICE_OFFERING : offers
    
    BOOKING ||--o| REVIEW : "receives"
    BOOKING ||--o{ PAYMENT : has

    USER {
        bigint id PK
        string name
        string email
        string password
        string phone
        enum role
    }

    PROVIDER_PROFILE {
        bigint id PK
        bigint user_id FK
        enum service_type
        text description
        double base_price
        double rating
        boolean is_available
        double location_lat
        double location_lng
        string stripe_account_id
    }

    BOOKING {
        bigint id PK
        bigint customer_id FK
        bigint provider_id FK
        enum service_type
        enum status
        text note
        datetime scheduled_time
    }

    REVIEW {
        bigint id PK
        bigint booking_id FK
        bigint customer_id FK
        bigint provider_id FK
        int rating
        text comment
    }
```

---

## 6. AI Problem Diagnosis Workflow

This sequence diagram explains the flow of the AI diagnostic tool.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Gemini AI
    participant Database

    User->>Frontend: Upload image of household issue
    Frontend->>Backend: POST /api/ai/analyze (Multipart Image)
    Backend->>Cloudinary: Upload Image for Storage
    Backend->>Gemini AI: Request Image Analysis (Prompt + Base64 Image)
    Gemini AI-->>Backend: JSON Response (Issue Description, ServiceType)
    Backend->>Database: Query nearby/available providers for ServiceType
    Database-->>Backend: List of Providers
    Backend-->>Frontend: Analysis Result (Description, ServiceType, Provider List)
    Frontend-->>User: Display Diagnosis & Recommended Providers
```

---

## 7. System Activity Diagram

This activity diagram illustrates the core user journeys for both Customers and Service Providers, from registration to service completion and payment.

```mermaid
flowchart TD
    A([Start]) --> B{Has Account?}
    B -- No --> C[Register Account]
    B -- Yes --> D[Login]
    C --> D
    
    D --> E{User Role?}
    
    %% Customer Flow
    E -- Customer --> F[Customer Dashboard]
    F --> G{Need AI Diagnosis?}
    G -- Yes --> H[Upload Problem Photo]
    H --> I[AI Recommends Service Type]
    G -- No --> J[Search Category]
    I --> K[View Available Providers]
    J --> K
    K --> L[Send Booking Request]
    L --> M((Wait for Provider))
    
    %% Provider Flow
    E -- Provider --> N[Provider Dashboard]
    N --> O[Manage Availability]
    O --> P{New Booking Request?}
    P -- Yes --> Q{Accept or Reject?}
    P -- No --> O
    
    Q -- Reject --> R[Notify Customer: Rejected]
    R --> M
    M -- Rejected --> K
    
    Q -- Accept --> S[Notify Customer: Accepted]
    S --> T[Service In Progress]
    M -- Accepted --> T
    
    T --> U[Provider Completes Job]
    U --> V[Customer Pays via Stripe]
    V --> W[Provider Receives Payout]
    V --> X[Customer Leaves Review]
    W --> Z([End])
    X --> Z
```

---

## 8. Non-Functional Requirements (NFRs)
- **Scalability:** The backend uses stateless JWT authentication, making it easy to scale horizontally. Redis caching is used to optimize repetitive read queries.
- **Reliability:** The system falls back to mock generic responses if the Gemini API fails, ensuring the user experience is not completely blocked.
- **Performance:** Designed with pagination for large lists (providers, bookings, chat histories).
- **Security:** Passwords are encrypted using BCrypt. Secure HTTP-only integrations with Stripe are implemented for sensitive financial transactions.
- **Real-time Capabilities:** WebSockets enable immediate notifications and chat updates without need for long-polling.

---
*Generated for Quick Helper Project*
