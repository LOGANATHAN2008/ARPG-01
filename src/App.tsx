import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// ─── Layouts ───
import AdminLayout from '@/layouts/AdminLayout'
import TenantLayout from '@/layouts/TenantLayout'
import PublicLayout from '@/layouts/PublicLayout'

// ─── Auth pages (not lazy – needed immediately) ───
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// ─── Admin pages (lazy loaded) ───
const AdminDashboard     = lazy(() => import('@/pages/admin/Dashboard'))
const Properties         = lazy(() => import('@/pages/admin/Properties'))
const PropertyDetail     = lazy(() => import('@/pages/admin/PropertyDetail'))
const PropertyForm       = lazy(() => import('@/pages/admin/PropertyForm'))
const Buildings          = lazy(() => import('@/pages/admin/Buildings'))
const Floors             = lazy(() => import('@/pages/admin/Floors'))
const Rooms              = lazy(() => import('@/pages/admin/Rooms'))
const RoomDetail         = lazy(() => import('@/pages/admin/RoomDetail'))
const RoomForm           = lazy(() => import('@/pages/admin/RoomForm'))
const Beds               = lazy(() => import('@/pages/admin/Beds'))
const Tenants            = lazy(() => import('@/pages/admin/Tenants'))
const TenantDetail       = lazy(() => import('@/pages/admin/TenantDetail'))
const TenantForm         = lazy(() => import('@/pages/admin/TenantForm'))
const TenantCheckin      = lazy(() => import('@/pages/admin/TenantCheckin'))
const TenantCheckout     = lazy(() => import('@/pages/admin/TenantCheckout'))
const Payments           = lazy(() => import('@/pages/admin/Payments'))
const PaymentDetail      = lazy(() => import('@/pages/admin/PaymentDetail'))
const Invoices           = lazy(() => import('@/pages/admin/Invoices'))
const InvoiceDetail      = lazy(() => import('@/pages/admin/InvoiceDetail'))
const InvoiceForm        = lazy(() => import('@/pages/admin/InvoiceForm'))
const Complaints         = lazy(() => import('@/pages/admin/Complaints'))
const ComplaintDetail    = lazy(() => import('@/pages/admin/ComplaintDetail'))
const Maintenance        = lazy(() => import('@/pages/admin/Maintenance'))
const MaintenanceDetail  = lazy(() => import('@/pages/admin/MaintenanceDetail'))
const Announcements      = lazy(() => import('@/pages/admin/Announcements'))
const AnnouncementForm   = lazy(() => import('@/pages/admin/AnnouncementForm'))
const Amenities          = lazy(() => import('@/pages/admin/Amenities'))
const Documents          = lazy(() => import('@/pages/admin/Documents'))
const Reports            = lazy(() => import('@/pages/admin/Reports'))
const Analytics          = lazy(() => import('@/pages/admin/Analytics'))
const Staff              = lazy(() => import('@/pages/admin/Staff'))
const StaffForm          = lazy(() => import('@/pages/admin/StaffForm'))
const Notifications      = lazy(() => import('@/pages/admin/Notifications'))
const Settings           = lazy(() => import('@/pages/admin/Settings'))
const AuditLogs          = lazy(() => import('@/pages/admin/AuditLogs'))
const Enquiries          = lazy(() => import('@/pages/admin/Enquiries'))

// ─── Tenant pages (lazy loaded) ───
const TenantDashboard    = lazy(() => import('@/pages/tenant/Dashboard'))
const TenantRoom         = lazy(() => import('@/pages/tenant/MyRoom'))
const TenantPayments     = lazy(() => import('@/pages/tenant/Payments'))
const PayNow             = lazy(() => import('@/pages/tenant/PayNow'))
const TenantComplaints   = lazy(() => import('@/pages/tenant/Complaints'))
const RaiseComplaint     = lazy(() => import('@/pages/tenant/RaiseComplaint'))
const TenantComplaintDetail = lazy(() => import('@/pages/tenant/ComplaintDetail'))
const TenantNotices      = lazy(() => import('@/pages/tenant/Notices'))
const TenantDocuments    = lazy(() => import('@/pages/tenant/Documents'))
const TenantProfile      = lazy(() => import('@/pages/tenant/Profile'))

// ─── Public pages ───
const LandingPage        = lazy(() => import('@/pages/public/LandingPage'))
const RoomsAvailability  = lazy(() => import('@/pages/public/RoomsAvailability'))
const EnquiryPage        = lazy(() => import('@/pages/public/EnquiryPage'))

// ─── Shared ───
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  </div>
)

// ─── Route Guards ───
function RequireAuth({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'tenant' }) {
  const { user, profile, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <PageLoader />

  if (requiredRole === 'admin' && !['super_admin', 'admin', 'manager', 'staff'].includes(profile.role)) {
    return <Navigate to="/portal" replace />
  }
  if (requiredRole === 'tenant' && profile.role !== 'tenant') {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function RootRedirect() {
  const { profile, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!profile) return <Navigate to="/" replace />
  if (['super_admin', 'admin', 'manager', 'staff'].includes(profile.role)) {
    return <Navigate to="/admin" replace />
  }
  return <Navigate to="/portal" replace />
}

// ─── Query Client ───
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public Routes ── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/rooms" element={<RoomsAvailability />} />
                <Route path="/enquiry" element={<EnquiryPage />} />
              </Route>

              {/* ── Auth Routes ── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/app" element={<RootRedirect />} />

              {/* ── Admin Routes ── */}
              <Route
                path="/admin"
                element={
                  <RequireAuth requiredRole="admin">
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="properties" element={<Properties />} />
                <Route path="properties/new" element={<PropertyForm />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="properties/:id/edit" element={<PropertyForm />} />
                <Route path="buildings" element={<Buildings />} />
                <Route path="floors" element={<Floors />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="rooms/new" element={<RoomForm />} />
                <Route path="rooms/:id" element={<RoomDetail />} />
                <Route path="rooms/:id/edit" element={<RoomForm />} />
                <Route path="beds" element={<Beds />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="tenants/new" element={<TenantForm />} />
                <Route path="tenants/:id" element={<TenantDetail />} />
                <Route path="tenants/:id/edit" element={<TenantForm />} />
                <Route path="tenants/:id/checkin" element={<TenantCheckin />} />
                <Route path="tenants/:id/checkout" element={<TenantCheckout />} />
                <Route path="payments" element={<Payments />} />
                <Route path="payments/:id" element={<PaymentDetail />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/new" element={<InvoiceForm />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="complaints" element={<Complaints />} />
                <Route path="complaints/:id" element={<ComplaintDetail />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="maintenance/:id" element={<MaintenanceDetail />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="announcements/new" element={<AnnouncementForm />} />
                <Route path="announcements/:id/edit" element={<AnnouncementForm />} />
                <Route path="amenities" element={<Amenities />} />
                <Route path="documents" element={<Documents />} />
                <Route path="reports" element={<Reports />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="staff" element={<Staff />} />
                <Route path="staff/new" element={<StaffForm />} />
                <Route path="staff/:id/edit" element={<StaffForm />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="enquiries" element={<Enquiries />} />
              </Route>

              {/* ── Tenant Portal Routes ── */}
              <Route
                path="/portal"
                element={
                  <RequireAuth requiredRole="tenant">
                    <TenantLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<TenantDashboard />} />
                <Route path="room" element={<TenantRoom />} />
                <Route path="payments" element={<TenantPayments />} />
                <Route path="payments/pay" element={<PayNow />} />
                <Route path="complaints" element={<TenantComplaints />} />
                <Route path="complaints/new" element={<RaiseComplaint />} />
                <Route path="complaints/:id" element={<TenantComplaintDetail />} />
                <Route path="notices" element={<TenantNotices />} />
                <Route path="documents" element={<TenantDocuments />} />
                <Route path="profile" element={<TenantProfile />} />
              </Route>

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
