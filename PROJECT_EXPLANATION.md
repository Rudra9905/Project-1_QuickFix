# Quick Helper: Deep Technical Architecture and File Explanation

This document provides a highly technical, deep dive into the inner workings of the **Quick Helper** project. It explains *how* the files interact at the system level, including data flows, networking, state management, and algorithmic design.

---

## 1. Backend (Spring Boot 3.x / Java 17)
**Path:** `Backend/src/main/java/com/quickhelper/backend/`

The backend follows a strict Layered Architecture (Controller -> Service -> Repository -> Database). It is a monolithic application that acts as a secure REST API provider and a STOMP WebSocket message broker over TCP.

### 1.1 `config/` (System Configuration & Security Handshake)
This directory wires together external integrations and intercepts incoming requests before they reach the API endpoints.

- **`SecurityConfig.java`**: Implements the `SecurityFilterChain`. This is the core perimeter defense. It disables CSRF (Cross-Site Request Forgery) since the app uses stateless JWT tokens instead of session cookies. It registers the `JwtAuthenticationFilter` before the standard `UsernamePasswordAuthenticationFilter`. It sets up CORS (Cross-Origin Resource Sharing) allowed origins and methods so the React frontend can talk to the backend without blocking.
- **`JwtAuthenticationFilter.java`**: Inherits from `OncePerRequestFilter`. On every incoming HTTP request, it reads the `Authorization: Bearer <token>` header. It uses the `io.jsonwebtoken` library to parse and cryptographically verify the token's signature using a secret key. If valid, it extracts the `userId` claim, loads the `UserPrincipal`, and manually injects a `UsernamePasswordAuthenticationToken` into the `SecurityContextHolder`, fully authenticating the thread.
- **`WebSocketConfig.java`**: Implements `WebSocketMessageBrokerConfigurer`. Technically, it configures the `SimpMessagingTemplate` in-memory message broker. It registers the endpoint `/ws` for the physical WebSocket connection (with SockJS fallback). It defines application destination prefixes (`/app` for sending messages) and broker prefixes (`/topic`, `/queue` for subscribing to topics).
- **`CustomHandshakeHandler.java` / `WebsocketHandshakeInterceptor.java`**: WebSockets don't natively send Authorization headers during the HTTP `101 Switching Protocols` upgrade step. These interceptors extract the `userId` from query parameters or session attributes, mapping the active WebSocket TCP session to a specific `Principal` (user).

### 1.2 `controller/` (REST API Endpoints)
Controllers use `@RestController` (combines `@Controller` and `@ResponseBody`), meaning return values are automatically serialized into JSON via Jackson (`ObjectMapper`).

- **`AuthController.java`**: Receives raw passwords via `RegisterRequestDTO`. It delegates to `UserService` where the password is synchronously hashed via `BCryptPasswordEncoder` (a one-way adaptive hashing algorithm) before saving it to the database. On login, it matches the raw password hash against the stored hash and generates a signed JWT string.
- **`PaymentController.java`**: The bridge to the Stripe Java SDK. When a user pays, this controller receives the requested amount, calls Stripe's backend using the secret key to build a `PaymentIntent`, and returns the `client_secret` to frontend. For providers, it generates Stripe Connect Account Links to securely onboard them to Stripe without storing PII on our servers.
- **`AIController.java` & `AIService.java`**: Receives an HTTP `multipart/form-data` image stream. Technically:
    1. The image is passed to `fileStorageService.storeFile()`, which uploads the byte array to Cloudinary and returns a secure HTTPS URL.
    2. Uses Spring's `RestClient` to construct a large, nested JSON payload containing the image encoded as a Base64 String and a highly specific prompt instructing the Google Gemini LLM to respond exclusively in a predefined JSON schema schema (extracting `ServiceType` and `Description`).
    3. Uses `ObjectMapper.readTree` to traverse the resulting JSON response from Gemini, dynamically parsing the fields, mapping strings to `ServiceType` enums.
- **`ChatController.java`**: Uses `@MessageMapping` instead of `@PostMapping`. When the frontend pushes a STOMP frame to `/app/chat.sendMessage`, this controller handles it, persists the message into the PostgreSQL `chat_message` table, and then aggressively broadcasts it via `SimpMessagingTemplate.convertAndSendToUser()` to the recipient's active topic subscription (e.g., `/user/{recipientId}/queue/messages`), resulting in a micro-second real-time push to the other phone/browser.

### 1.3 `service/` (Core Algorithmic Logic)
- **`ProviderService.java` (Geospatial Logic)**: When searching for providers, the service needs to find users near specific GPS coordinates. Since it uses standard PostgreSQL (and potentially not PostGIS extensions), it likely utilizes the **Haversine Formula** (calculating the great-circle distance between two points on the Earth's surface) inside a custom JPA Native Query (`@Query(value="SELECT ...", nativeQuery=true)`) or fetches a bounding box of providers and calculates distances in-memory using Java Math standard library.
- **`BookingService.java` (State Machine)**: Bookings are strictly enforced state machines (`REQUESTED -> ACCEPTED -> COMPLETED` or `REQUESTED -> REJECTED`). The service validates transitions (e.g., you cannot "ACCEPT" an already "COMPLETED" job). It leverages standard transaction management (`@Transactional`) to ensure isolation levels and atomicity; if an exception is thrown mid-booking, the entire transaction rolls back the PostgreSQL sequence.

### 1.4 `model/` (Hibernate JPA Entities)
The mapping between JVM object instances and PostgreSQL tuples. This uses Hibernate as the JPA provider.
- Data encapsulation uses Lombok (`@Getter`, `@Setter`, `@NoArgsConstructor`) at compile-time to reduce boilerplate byte code.
- Uses strict relationships:
    - `@OneToOne`: `User` -> `ProviderProfile` (Lazy fetched because we don't always need a provider profile when fetching a basic user).
    - `@ManyToOne`: `Booking` -> `User` (Customer) and `ProviderProfile`.
- Database schemas are auto-generated via Spring Boot's `<property name="hibernate.hbm2ddl.auto" value="update"/>`, automatically issuing `CREATE TABLE` and `ALTER TABLE` DDL queries.

### 1.5 `repository/` (Spring Data JPA)
Abstracts the `EntityManager`. Interfaces that extend `JpaRepository<Entity, Long>`. Behind the scenes, Spring creates proxy classes at runtime via JDK Dynamic Proxies, intercepting calls like `findByEmail` and translating them dynamically into `SELECT * FROM users WHERE email = ?` parameterized SQL statements to strictly block SQL injection attacks.

---

## 2. Frontend (React 19 / Vite / TypeScript)
**Path:** `Frontend/src/`

The frontend is a strictly-typed React environment. It relies on the Virtual DOM (VDOM) for fast, differential rendering.

### 2.1 Bundling and Core Mechanics
- **`vite.config.ts`**: Replaces the sluggish Webpack. It uses native ESM (ECMAScript Modules) in development for ultra-fast Hot Module Replacement (HMR) and relies on Rollup under the hood for optimized production builds.
- **`api.ts` (Axios Configuration)**: Creates a global singleton instance of the Axios HTTP client. It attaches an interceptor (`axios.interceptors.request.use`). This implies that directly preceding *any* outgoing `fetch/xhr` call to the Spring API, Axios automatically inserts the `Authorization: Bearer <localStorage.getItem("token")>` HTTP header. This abstracts token management away from individual React components.

### 2.2 `contexts/` (Global State & Event Emitters)
Instead of prop-drilling or large Redux states, the app relies heavily on the React Context API (`createContext`/`useContext`).

- **`AuthContext.tsx`**: Uses `useState` hooks to store the `User` object. On Mount (`useEffect`), it scans `localStorage` for a stored JWT. If found, it fires an HTTP `GET /api/users/me` to the backend to hydrate the active user session. It wraps the entire app tree via `<AuthProvider>`, broadcasting credentials globally using the generic `Provider` pattern.
- **`ChatContext.tsx` & `websocketService.ts` (The STOMP Pipeline)**:
    - `websocketService.ts` is a vanilla TypeScript Singleton relying on the `@stomp/stompjs` and `sockjs-client` packages.
    - It manually establishes an HTTP upgrade on `ws://localhost:8080/ws`. It bypasses React state until frames are received. 
    - Upon receiving a JSON STOMP `MESSAGE` frame from the Spring Boot `SimpMessagingTemplate`, it parses the `body` string into JSON. It intercepts this signal and triggers callback functions back into the `ChatContext`.
    - `ChatContext` then mutates a `messages: []` object inside a `setMessages()` state change. React calculates the VDOM diff and flushes changes to the screen, showing the bubble immediately.

### 2.3 `pages/` (View State and Business Logic)
These are smart container components holding intense client-side logic.

- **`AISolver.tsx`**: When a photo is dropped in the `input type="file"`, it captures the binary `File` array buffer. To send this to the Spring backend `AIController`, it constructs a dynamic `FormData` object (since we cannot send raw JSON blobs holding megabytes of binary streams). `axios.post` sets the HTTP Content-Type to `multipart/form-data; boundary=---...`. The screen blocks user input with `<Loader />` until Spring returns the Gemini string, then unmounts the loader.
- **`PaymentForm.tsx` (Stripe Elements Integration)**: 
    1. Fetches the `client_secret` string from the backend `PaymentController`. Wait until received.
    2. Injects the highly secure `<Elements>` PCI-compliant iFrame from `@stripe/react-stripe-js`.
    3. Handles the `stripe.confirmPayment` promise heavily in memory. If success, Stripe's systems do the heavy lifting of processing the card network sequence, preventing sensitive PANs (Primary Account Numbers) from ever touching your React variables.

### 2.4 `components/ui/` & Tailwind Styling Engine
- The UI components exclusively use Tailwind CSS. This means `index.css` acts as a compiler map. Unlike runtime styled-components, at build-time (PostCSS), Tailwind statically reads every `.tsx` file, extracts every unique class string (e.g., `flex`, `pt-4`, `bg-blue-500`), and prunes away all unused CSS, creating a tiny, hyper-optimized output stylesheet. It enforces atomic design principles natively.

---
*End of Technical Explanation Document*
