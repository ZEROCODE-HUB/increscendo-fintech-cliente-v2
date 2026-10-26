import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/my-loans')) return 'Mis Préstamos';
    if (path.includes('/loan-request')) return 'Solicitar Préstamo';
    if (path.includes('/loan-process')) return 'Proceso de Préstamo';
    if (path.includes('/memberships')) return 'Membresías';
    if (path.includes('/history')) return 'Historial';
    if (path.includes('/notifications')) return 'Notificaciones';
    if (path.includes('/payment-methods')) return 'Métodos de Pago';
    if (path.includes('/mi-cuenta')) return 'Mi Cuenta';
    if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (path.includes('/admin/loans')) return 'Gestión Préstamos';
    if (path.includes('/admin/clients')) return 'Gestión Clientes';
    if (path.includes('/admin/memberships')) return 'Gestión Membresías';
    if (path.includes('/admin/coupons')) return 'Gestión Cupones';
    if (path.includes('/admin/config')) return 'Configuración';
    return '';
  };

  const isClient = userRole === 'client';

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-3 fixed md:sticky top-0 z-10 w-full">
      <SidebarTrigger />
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-semibold truncate">
          {getPageTitle()}
        </h1>
      </div>
      {isClient && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/service-selection')}
            className="gap-1.5 text-xs sm:text-sm shrink-0 text-primary"
          >
            <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Servicios</span>
          </Button>
      )}
      {showBackButton && (
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-1.5 text-xs sm:text-sm shrink-0"
          size="sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
      )}
    </header>
  );
};
