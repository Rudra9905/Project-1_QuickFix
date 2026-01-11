# Detailed Project Architecture

This document provides a comprehensive technical overview of the **Quick Helper** application, detailing the interaction between specific frontend components, backend services, and database entities.

## Technology Stack & Versions

-   **Frontend**: React 18, TypeScript, Vite 5, TailwindCSS 3.4
-   **Backend**: Spring Boot 3.2, Java 17, Spring Security 6, Spring Data JPA
-   **Database**: PostgreSQL 15+ (Relational)
-   **Real-time**: WebSocket (STOMP), SockJS
-   **Storage**: Cloudinary
-   **Migration**: Flyway

---

## Comprehensive Architecture Diagram

This diagram maps the flow from specific React pages down to the database tables.

```mermaid
graph TD
    %% =======================
    %% STYLES
    %% =======================
    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef api fill:#fff8e1,stroke:#f57f17,stroke-width:2px;
    classDef controller fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef service fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef repo fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef db fill:#eceff1,stroke:#37474f,stroke-width:2px;
    classDef external fill:#fce4ec,stroke:#880e4f,stroke-width:2px;

    %% =======================
    %% FRONTEND LAYER
    %% =======================
    subgraph Frontend ["Frontend (React/TS)"]
        direction TB
        
        subgraph Pages ["Pages / Views"]
            Landing[LandingPage.tsx]:::frontend
            Login[Login.tsx / Register.tsx]:::frontend
            UserDash[Dashboard.tsx]:::frontend
            ProvDash[ProviderDashboard.tsx]:::frontend
            BookingsUI[Bookings.tsx]:::frontend
            ProfileUI[Profile.tsx / ProviderProfile.tsx]:::frontend
            SelectProv[SelectProvider.tsx]:::frontend
        end

        subgraph FEServices ["Frontend API Services"]
            AuthAPI[api.ts (Auth)]:::api
            BookingAPI[api.ts (Booking)]:::api
            ProvAPI[api.ts (Provider)]:::api
            MediaAPI[api.ts (Media)]:::api
            WSClient[WebSocket Client (SockJS)]:::api
        end
    end

    %% =======================
    %% BACKEND LAYER
    %% =======================
    subgraph Backend ["Backend (Spring Boot)"]
        direction TB

        subgraph Controllers ["Wrapper / Controllers"]
            AuthCtrl[AuthController]:::controller
            BookingCtrl[BookingController]:::controller
            ProvCtrl[ProviderController]:::controller
            NotifCtrl[NotificationController]:::controller
            StatsCtrl[StatsController]:::controller
            WSEndpoint[WebSocketConfig (/ws)]:::controller
        end

        subgraph Services ["Business Logic"]
            AuthSvc[UserService / AuthService]:::service
            BookingSvc[BookingService]:::service
            ProvSvc[ProviderService]:::service
            NotifSvc[NotificationService]:::service
            FileSvc[FileStorageService]:::service
            StatsSvc[StatsService]:::service
        end

        subgraph Repos ["Data Access (JPA)"]
            UserRepo[UserRepository]:::repo
            BookingRepo[BookingRepository]:::repo
            ProvRepo[ProviderRepository]:::repo
            NotifRepo[NotificationRepository]:::repo
            ReviewRepo[ReviewRepository]:::repo
        end
    end

    %% =======================
    %% DATA & EXTERNAL LAYER
    %% =======================
    subgraph Data ["Database (PostgreSQL)"]
        UsersTbl[(users)]:::db
        BookingTbl[(booking)]:::db
        ProvProfTbl[(provider_profile)]:::db
        NotifTbl[(notification)]:::db
        ReviewsTbl[(review)]:::db
        ServiceOffTbl[(service_offering)]:::db
    end

    subgraph External ["External APIs"]
        Cloudinary[Cloudinary API]:::external
    end

    %% =======================
    %% CONNECTIONS
    %% =======================

    %% Frontend Page -> API Service
    Login --> AuthAPI
    UserDash --> BookingAPI
    UserDash --> ProvAPI
    ProvDash --> StatsCtrl
    BookingsUI --> BookingAPI
    ProfileUI --> AuthAPI
    ProfileUI --> MediaAPI
    SelectProv --> ProvAPI

    %% API Service -> Controller (HTTP)
    AuthAPI -- POST /auth --> AuthCtrl
    BookingAPI -- POST/GET /bookings --> BookingCtrl
    ProvAPI -- GET /providers --> ProvCtrl
    MediaAPI -- POST /upload --> ProvCtrl

    %% WebSocket Connection
    WSClient -- CONNECT /ws --> WSEndpoint
    WSEndpoint --> NotifCtrl

    %% Controller -> Service
    AuthCtrl --> AuthSvc
    BookingCtrl --> BookingSvc
    ProvCtrl --> ProvSvc
    NotifCtrl --> NotifSvc
    StatsCtrl --> StatsSvc
    
    %% Service -> Service (Inter-service comms)
    BookingSvc -- Notify User/Provider --> NotifSvc
    ProvSvc -- Upload File --> FileSvc

    %% Service -> Repository
    AuthSvc --> UserRepo
    BookingSvc --> BookingRepo
    ProvSvc --> ProvRepo
    NotifSvc --> NotifRepo
    ProvSvc --> ReviewRepo
    BookingSvc --> UserRepo

    %% Repository -> Database
    UserRepo <--> UsersTbl
    BookingRepo <--> BookingTbl
    ProvRepo <--> ProvProfTbl
    ProvRepo <--> ServiceOffTbl
    NotifRepo <--> NotifTbl
    ReviewRepo <--> ReviewsTbl
    
    %% External Integrations
    FileSvc -- Upload Image/Video --> Cloudinary
    NotifSvc -- Push /topic/user/{id} --> WSClient

    %% Flow Styles
    linkStyle 25,26,27 stroke:#f57f17,stroke-width:2px; %% API Calls
    linkStyle 33,34 stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5; %% Internal Service Calls
    linkStyle 43 stroke:#880e4f,stroke-width:2px; %% Cloudinary
```

---

## Detailed Data Flow & Component Breakdown

### 1. Authentication & User Management
*   **Frontend**: `Login.tsx`, `Register.tsx` use `AuthAPI` to send credentials.
*   **Backend**: `AuthController` receives requests. `UserService` handles registration and validation.
*   **Security**: Spring Security defaults with JWT (JSON Web Tokens) are used to stateless authentication.
*   **Database**: `users` table stores credentials (hashed), roles (User/Provider), and base profile info.

### 2. Provider Discovery & Profiles
*   **Frontend**: `LandingPage.tsx` and `SelectProvider.tsx` fetch provider lists.
*   **Backend**: `ProviderController` exposes endpoints to search and filter providers.
*   **Data**: `ProviderService` aggregates data from `users`, `provider_profile`, `service_offering`, and `reviews` tables.
*   **Media**: Profile images and work portfolio videos are uploaded via `FileStorageService` to **Cloudinary**, and URLs are stored in `provider_profile`.

### 3. Booking Lifecycle
The booking process is the core engine of the application.

1.  **Creation**: User selects a provider -> `BookingController.createBooking()` -> `BookingService` saves to `booking` table with status `PENDING`.
2.  **Notification**: `BookingService` triggers `NotificationService.notifyBookingRequestSent()`.
3.  **Real-time Push**: `NotificationService` pushes a WebSocket message to `/topic/provider/{id}/notifications`.
4.  **Provider Action**: Provider receives alert on `ProviderDashboard.tsx`. Accepts/Rejects via `BookingController`.
5.  **Updates**: Status changes (ACCEPTED, REJECTED, COMPLETED) update the `booking` table and trigger corresponding notifications back to the user.

### 4. Real-time Notification System
*   **Protocol**: STOMP over WebSocket (with SockJS fallback).
*   **Endpoint**: `/ws`
*   **Topics**:
    *   **User**: `/topic/user/{userId}/notifications`
    *   **Provider**: `/topic/provider/{providerId}/notifications`
*   **Persistence**: Failed WebSocket deliveries are stored in the `notification` table and fetched on next login via `NotificationController.getUnread()`.

### 5. Review & Rating System
*   **Trigger**: After `BookingStatus.COMPLETED`, the user is prompted to review.
*   **Flow**: `Reviews.tsx` -> `ReviewController` -> `ReviewService`.
*   **Storage**: Ratings are stored in `review` table and linked to both the `booking` and the `provider`.
*   **Aggregates**: Provider's average rating is recalculated and stored/cached for quick display on cards.
