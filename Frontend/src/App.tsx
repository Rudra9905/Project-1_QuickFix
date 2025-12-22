import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Providers } from './pages/Providers'
import { SelectProvider } from './pages/SelectProvider'
import { Bookings } from './pages/Bookings'
import { Reviews } from './pages/Reviews'
import { Profile } from './pages/Profile'
import { LandingPage } from './pages/LandingPage'
import Earnings from './pages/Earnings'
import { AdminDashboard } from './pages/AdminDashboard'
import { ProviderReviewDetail } from './pages/ProviderReviewDetail'
import { ProviderProfileSetup } from './pages/ProviderProfileSetup'
import { MultipleBookingDates } from './pages/MultipleBookingDates'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/providers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Providers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-provider"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SelectProvider />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/multiple-dates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MultipleBookingDates />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bookings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Earnings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reviews />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider-setup"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProviderProfileSetup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Legacy routes redirect to new unified page */}
            <Route path="/create-provider-profile" element={<Navigate to="/provider-setup" replace />} />
            <Route path="/complete-provider-profile" element={<Navigate to="/provider-setup" replace />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout showBottomNav={false}>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/providers/:id"
              element={
                <AdminRoute>
                  <Layout showBottomNav={false}>
                    <ProviderReviewDetail />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#FFFFFF',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
                padding: '16px',
                fontSize: '14px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#16A34A',
                  secondary: '#FFFFFF',
                },
                style: {
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#DC2626',
                  secondary: '#FFFFFF',
                },
                style: {
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
                },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
