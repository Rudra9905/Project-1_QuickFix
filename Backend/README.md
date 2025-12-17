# Quick Helper Backend

On-demand helper booking application backend built with Spring Boot 3.x.

## Overview

This is the backend API for a Quick Helper booking platform (similar to Urban Company). Users can request services from providers (plumbers, electricians, cleaners, etc.), and providers can accept or decline requests.

## Tech Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security** (configured with permitAll for MVP)
- **MySQL** (running locally in Docker)
- **Maven**
- **Lombok**

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+ (running in Docker at localhost:3306)
- Docker (for MySQL)

## Database Setup

1. Start MySQL in Docker:
```bash
docker run --name quick-helper-mysql -e MYSQL_ROOT_PASSWORD=rootpw -e MYSQL_DATABASE=quick_helper -p 3306:3306 -d mysql:8.0
```

2. The application will automatically create the database schema on startup (using `spring.jpa.hibernate.ddl-auto=update`)

## Configuration

Update `src/main/resources/application.properties` if your MySQL credentials differ:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quick_helper?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=rootpw
```

## Running the Application

1. Build the project:
```bash
mvn clean install
```

2. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## API Endpoints

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "USER"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Users

#### Get Current User
```bash
GET /api/users/me?userId=1
```

#### Get User by ID
```bash
GET /api/users/1
```

#### Get All Users
```bash
GET /api/users
```

### Providers

#### Create Provider Profile
```bash
POST /api/providers?userId=2
Content-Type: application/json

{
  "serviceType": "PLUMBER",
  "description": "Expert plumber with 10 years experience",
  "basePrice": 100,
  "locationLat": 40.7128,
  "locationLng": -74.0060
}
```

#### Get All Providers
```bash
GET /api/providers
```

#### Get Available Providers by Service Type
```bash
GET /api/providers/available?serviceType=PLUMBER
```

#### Get Provider by ID
```bash
GET /api/providers/1
```

#### Update Provider Availability
```bash
PUT /api/providers/1/availability
Content-Type: application/json

{
  "isAvailable": false
}
```

#### Update Provider Location
```bash
PUT /api/providers/1/location
Content-Type: application/json

{
  "locationLat": 40.7580,
  "locationLng": -73.9855
}
```

### Bookings

#### Create Booking Request
```bash
POST /api/bookings?userId=1
Content-Type: application/json

{
  "providerId": 2,
  "serviceType": "PLUMBER",
  "note": "Need urgent plumbing service"
}
```

#### Get Bookings by User
```bash
GET /api/bookings/user/1
```

#### Get Bookings by Provider
```bash
GET /api/bookings/provider/2
```

#### Accept Booking
```bash
PUT /api/bookings/1/accept
```

#### Reject Booking
```bash
PUT /api/bookings/1/reject
```

#### Cancel Booking
```bash
PUT /api/bookings/1/cancel
```

#### Complete Booking
```bash
PUT /api/bookings/1/complete
```

### Reviews

#### Create Review
```bash
POST /api/reviews
Content-Type: application/json

{
  "bookingId": 1,
  "rating": 5,
  "comment": "Excellent service!"
}
```

#### Get Reviews by Provider
```bash
GET /api/reviews/provider/2
```

## Sample cURL Examples

### 1. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "USER"
  }'
```

### 2. Register a Provider
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "phone": "+1234567891",
    "role": "PROVIDER"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Create Provider Profile
```bash
curl -X POST "http://localhost:8080/api/providers?userId=2" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "PLUMBER",
    "description": "Expert plumber",
    "basePrice": 100,
    "locationLat": 40.7128,
    "locationLng": -74.0060
  }'
```

### 5. Request Booking
```bash
curl -X POST "http://localhost:8080/api/bookings?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 2,
    "serviceType": "PLUMBER",
    "note": "Need plumbing service"
  }'
```

### 6. Accept Booking
```bash
curl -X PUT http://localhost:8080/api/bookings/1/accept
```

### 7. Update Provider Location
```bash
curl -X PUT http://localhost:8080/api/providers/1/location \
  -H "Content-Type: application/json" \
  -d '{
    "locationLat": 40.7580,
    "locationLng": -73.9855
  }'
```

## Project Structure

```
src/main/java/com/quickhelper/backend/
├── config/
│   └── SecurityConfig.java
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── ProviderController.java
│   ├── BookingController.java
│   └── ReviewController.java
├── dto/
│   ├── RegisterRequestDTO.java
│   ├── LoginRequestDTO.java
│   ├── AuthResponseDTO.java
│   ├── UserResponseDTO.java
│   ├── ProviderCreateRequestDTO.java
│   ├── ProviderResponseDTO.java
│   ├── BookingRequestDTO.java
│   ├── BookingResponseDTO.java
│   ├── ReviewRequestDTO.java
│   └── ReviewResponseDTO.java
├── exception/
│   ├── ResourceNotFoundException.java
│   ├── DuplicateResourceException.java
│   ├── BadRequestException.java
│   ├── ErrorResponse.java
│   └── GlobalExceptionHandler.java
├── model/
│   ├── User.java
│   ├── ProviderProfile.java
│   ├── Booking.java
│   ├── Review.java
│   ├── UserRole.java
│   ├── ServiceType.java
│   └── BookingStatus.java
├── repository/
│   ├── UserRepository.java
│   ├── ProviderProfileRepository.java
│   ├── BookingRepository.java
│   └── ReviewRepository.java
└── service/
    ├── UserService.java
    ├── ProviderService.java
    ├── BookingService.java
    └── ReviewService.java
```

## Domain Model

### User
- Represents both regular users and providers
- Role-based: USER or PROVIDER
- Contains authentication information

### ProviderProfile
- One-to-one relationship with User (role PROVIDER)
- Contains service type, pricing, location, availability
- Rating calculated from reviews

### Booking
- Links a USER to a PROVIDER
- Tracks service type and status
- Status flow: REQUESTED → ACCEPTED/REJECTED → COMPLETED

### Review
- One-to-one relationship with completed Booking
- Updates provider rating automatically

## Error Handling

The API uses a global exception handler that returns standardized error responses:

```json
{
  "timestamp": "2024-01-01T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation error message",
  "path": "/api/endpoint"
}
```

## Testing

Run tests with:
```bash
mvn test
```

Test coverage includes:
- UserService (register, authenticate, duplicate email handling)
- ProviderService (create profile, update location, update availability)
- BookingService (create booking, accept, reject, complete)

## Security

Currently configured with `permitAll()` for MVP phase. Future enhancements will include:
- JWT token-based authentication
- Role-based access control
- Password encryption (already implemented with BCrypt)

## Future Enhancements

- JWT authentication
- Real-time location tracking
- WebSocket support for live updates
- Payment integration
- Push notifications
- Advanced search and filtering
- Distance-based provider matching

## License

This project is part of a development exercise.
