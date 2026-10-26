import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ClientLayout } from '@/client/components/ClientLayout';
import { PublicLayout, AdminLayout, AuthLayout, WebMaintenanceLayout } from '@/components/layouts/Layouts';
import { RequireAuth, RequireGuest, RoleGuard, PageLoader } from '@/components/guards';
import { webMaintenanceLoader, adminMaintenanceLoader } from '@/lib/maintenanceLoaders';
import type { UserRole } from '@/types/users';

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const wrapSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
);

const AuthPage = React.lazy(() => import('@/client/pages/Login'));

// Área de clientes (rediseño)
const CHome = React.lazy(() => import('@/client/pages/Home'));
const CMemberships = React.lazy(() => import('@/client/pages/Memberships'));
const CCheckout = React.lazy(() => import('@/client/pages/Checkout'));
const CServices = React.lazy(() => import('@/client/pages/Services'));
const CServicesEmbed = React.lazy(() => import('@/client/pages/ServicesEmbed'));
const CMovements = React.lazy(() => import('@/client/pages/Movements'));
const CProfile = React.lazy(() => import('@/client/pages/Profile'));
const CIdentity = React.lazy(() => import('@/client/pages/Identity'));
const CPaymentMethods = React.lazy(() => import('@/client/pages/PaymentMethods'));
const CNotifications = React.lazy(() => import('@/client/pages/Notifications'));
const CLoans = React.lazy(() => import('@/client/pages/Loans'));
const CLoanDetail = React.lazy(() => import('@/client/pages/LoanDetail'));
const CLoanFlow = React.lazy(() => import('@/client/pages/LoanFlow'));
const CCard = React.lazy(() => import('@/client/pages/Card'));
const CCardRequest = React.lazy(() => import('@/client/pages/CardRequest'));
const CHelp = React.lazy(() => import('@/client/pages/Help'));

const Index = React.lazy(() => import('@/pages/Index'));
const PaymentSuccess = React.lazy(() => import('@/pages/PaymentSuccess'));
const PaymentError = React.lazy(() => import('@/pages/PaymentError'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const ClientManagement = React.lazy(() => import('@/pages/admin/ClientManagement'));
const LoanManagement = React.lazy(() => import('@/pages/admin/LoanManagement'));
const SystemConfig = React.lazy(() => import('@/pages/admin/SystemConfig'));
const MembershipManagement = React.lazy(() => import('@/pages/admin/MembershipManagement'));
const CouponManagement = React.lazy(() => import('@/pages/admin/CouponManagement'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const AvisoLegal = React.lazy(() => import('@/pages/AvisoLegal'));
const PoliticasPrivacidad = React.lazy(() => import('@/pages/PoliticasPrivacidad'));
const TerminosCondiciones = React.lazy(() => import('@/pages/TerminosCondiciones'));
const PrivacidadEmpleo = React.lazy(() => import('@/pages/PrivacidadEmpleo'));
const TipsSeguridad = React.lazy(() => import('@/pages/TipsSeguridad'));
const BolsaTrabajo = React.lazy(() => import('@/pages/BolsaTrabajo'));
const CentroAyuda = React.lazy(() => import('@/pages/CentroAyuda'));
const Contacto = React.lazy(() => import('@/pages/Contacto'));
const CancelacionTerminos = React.lazy(() => import('@/pages/CancelacionTerminos'));
const ProntipagosSSO = React.lazy(() => import('@/pages/ProntipagosSSO'));
const UsuarioNuevoMarketing = React.lazy(() => import('@/pages/UsuarioNuevoMarketing'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));

const RequireAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireAuth loadingComponent={<LoadingFallback />}>{children}</RequireAuth>
);

const RequireGuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireGuest loadingComponent={<LoadingFallback />}>{children}</RequireGuest>
);

const RoleGuardRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[]; fallbackPath?: string }> = ({ children, allowedRoles, fallbackPath }) => (
  <RoleGuard allowedRoles={allowedRoles} loadingComponent={<LoadingFallback />} fallbackPath={fallbackPath}>{children}</RoleGuard>
);

const client = (el: React.ReactNode) => (
  <RequireAuthRoute>
    <RoleGuardRoute allowedRoles={['client']} fallbackPath="/admin/dashboard">{el}</RoleGuardRoute>
  </RequireAuthRoute>
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: 'auth', element: <RequireGuestRoute><AuthPage /></RequireGuestRoute> },
    ],
  },
  {
    element: <PublicLayout />,
    loader: webMaintenanceLoader,
    children: [
      { index: true, element: wrapSuspense(<Index />) },
      { path: 'usuario-nuevo-marketing', element: wrapSuspense(<UsuarioNuevoMarketing />) },
      { path: 'prontipagos-sso', element: wrapSuspense(<ProntipagosSSO />) },
    ],
  },
  {
    element: <ClientLayout />,
    loader: webMaintenanceLoader,
    children: [
      { path: 'dashboard', element: client(<CHome />) },
      { path: 'memberships', element: client(<CMemberships />) },
      { path: 'membership-checkout', element: client(<CCheckout />) },
      { path: 'servicios', element: client(<CServices />) },
      { path: 'servicios-recargas', element: client(<CServicesEmbed />) },
      { path: 'service-selection', element: <Navigate to="/servicios" replace /> },
      { path: 'history', element: client(<CMovements />) },
      { path: 'mi-cuenta', element: client(<CProfile />) },
      { path: 'identidad', element: client(<CIdentity />) },
      { path: 'payment-methods', element: client(<CPaymentMethods />) },
      { path: 'notifications', element: client(<CNotifications />) },
      { path: 'prestamos', element: client(<CLoans />) },
      { path: 'my-loans', element: client(<CLoans />) },
      { path: 'my-loans/:id', element: client(<CLoanDetail />) },
      { path: 'prestamos/solicitar', element: client(<CLoanFlow />) },
      { path: 'loan-request', element: <Navigate to="/prestamos/solicitar" replace /> },
      { path: 'loan-process', element: <Navigate to="/prestamos/solicitar" replace /> },
      { path: 'ayuda', element: client(<CHelp />) },
      { path: 'tarjeta', element: client(<CCard />) },
      { path: 'tarjeta/solicitar', element: client(<CCardRequest />) },
      { path: 'tarjeta/invitacion/:token', element: client(<CCardRequest />) },
      { path: 'payment-success', element: client(<PaymentSuccess />) },
      { path: 'payment-error', element: client(<PaymentError />) },
    ],
  },
  {
    element: <AdminLayout />,
    loader: adminMaintenanceLoader,
    children: [
      { path: 'admin/dashboard', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense></RoleGuardRoute> },
      { path: 'admin/loans', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><LoanManagement /></Suspense></RoleGuardRoute> },
      { path: 'admin/clients', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><ClientManagement /></Suspense></RoleGuardRoute> },
      { path: 'admin/config', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><SystemConfig /></Suspense></RoleGuardRoute> },
      { path: 'admin/memberships', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><MembershipManagement /></Suspense></RoleGuardRoute> },
      { path: 'admin/coupons', element: <RoleGuardRoute allowedRoles={['admin']}><Suspense fallback={<LoadingFallback />}><CouponManagement /></Suspense></RoleGuardRoute> },
    ],
  },
  {
    element: <WebMaintenanceLayout />,
    loader: webMaintenanceLoader,
    children: [
      { path: 'forgot-password', element: wrapSuspense(<ForgotPassword />) },
      { path: 'reset-password', element: wrapSuspense(<ResetPassword />) },
      { path: 'aviso-legal', element: wrapSuspense(<AvisoLegal />) },
      { path: 'politicas-privacidad', element: wrapSuspense(<PoliticasPrivacidad />) },
      { path: 'terminos-y-condiciones', element: wrapSuspense(<TerminosCondiciones />) },
      { path: 'privacidad-empleo', element: wrapSuspense(<PrivacidadEmpleo />) },
      { path: 'tips-seguridad', element: wrapSuspense(<TipsSeguridad />) },
      { path: 'bolsa-trabajo', element: wrapSuspense(<BolsaTrabajo />) },
      { path: 'centro-ayuda', element: wrapSuspense(<CentroAyuda />) },
      { path: 'contacto', element: wrapSuspense(<Contacto />) },
      { path: 'terminos-cancelacion', element: wrapSuspense(<CancelacionTerminos />) },
      { path: '*', element: wrapSuspense(<NotFound />) },
    ],
  },
]);

export default router;