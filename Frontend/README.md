# Quick Helper Frontend

React frontend for the Quick Helper on-demand service booking application.

## Tech Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Vite** as build tool

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   └── layout/      # Layout components (Navbar, Sidebar)
├── contexts/        # React contexts (AuthContext)
├── pages/           # Page components
├── services/        # API service layer
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component with routing
└── main.tsx         # Entry point
```

## Features

- ✅ User authentication (Login/Register)
- ✅ Dashboard with statistics
- ✅ Provider listing and search
- ✅ Booking management
- ✅ Review system
- ✅ Profile management
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Loading states

## API Integration

The frontend is fully connected to the Spring Boot backend at `http://localhost:8080/api`.

All API calls are handled through service files in `src/services/`:
- `authService.ts` - Authentication
- `userService.ts` - User operations
- `providerService.ts` - Provider operations
- `bookingService.ts` - Booking operations
- `reviewService.ts` - Review operations

## Authentication

The app uses localStorage to store authentication tokens. The AuthContext provides:
- `login(email, password)` - Login user
- `register(data)` - Register new user
- `logout()` - Logout user
- `user` - Current user object
- `isAuthenticated` - Authentication status

## Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (protected)
- `/providers` - Provider listing (protected)
- `/bookings` - Booking management (protected)
- `/reviews` - Reviews (protected)
- `/profile` - User profile (protected)

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:8080/api`)
