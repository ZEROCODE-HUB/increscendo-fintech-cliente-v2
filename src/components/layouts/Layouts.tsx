import React, { Suspense } from 'react';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Chatbot } from '@/components/Chatbot';
import { AppHeader } from './AppHeader';
import { PageLoader } from '@/components/guards';
import { PublicHeader } from '@/components/layouts/PublicHeader';
import { PublicFooter } from '@/components/layouts/PublicFooter';
import { useAuth } from '@/contexts/AuthContext';
import type { AppSettings } from '@/services/settingsService';
import MaintenancePage from '@/pages/MaintenancePage';

export { AuthLayout } from '@/components/layouts/AuthLayout';

const PageContent: React.FC = () => (
  <div className="p-4 ">
    <Outlet />
  </div>
);

const isWebInMaintenance = (settings: AppSettings, userRole: string | null): boolean =>
  settings.maintenance_web && userRole !== 'admin';

export const PrivateLayout: React.FC = () => {
  const settings = useLoaderData() as AppSettings;
  const { userRole } = useAuth();

  if (isWebInMaintenance(settings, userRole)) {
    return <MaintenancePage variant="web" message={settings.message} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-x-hidden pt-16 sm:pt-20 md:pt-0">
            <Suspense fallback={<PageLoader />}>
              <PageContent />
            </Suspense>
          </main>
        </div>
        <Chatbot />
      </div>
    </SidebarProvider>
  );
};

export const PublicLayout: React.FC = () => {
  const settings = useLoaderData() as AppSettings;
  const { userRole } = useAuth();

  if (isWebInMaintenance(settings, userRole)) {
    return <MaintenancePage variant="web" message={settings.message} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <Suspense fallback={<PageLoader />}>
        <main className="pt-20 sm:pt-24">
          <Outlet />
        </main>
      </Suspense>
      <PublicFooter />
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  const settings = useLoaderData() as AppSettings;
  const location = useLocation();

  // Excepción antilockout: /admin/config se mantiene accesible para desactivar el modo.
  if (settings.maintenance_admin && location.pathname !== '/admin/config') {
    return <MaintenancePage variant="admin" message={settings.message} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-x-hidden pt-16 sm:pt-20 md:pt-0">
            <Suspense fallback={<PageLoader />}>
              <PageContent />
            </Suspense>
          </main>
        </div>
        <Chatbot />
      </div>
    </SidebarProvider>
  );
};

export const WebMaintenanceLayout: React.FC = () => {
  const settings = useLoaderData() as AppSettings;
  const { userRole } = useAuth();

  if (isWebInMaintenance(settings, userRole)) {
    return <MaintenancePage variant="web" message={settings.message} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export const BareLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </div>
);