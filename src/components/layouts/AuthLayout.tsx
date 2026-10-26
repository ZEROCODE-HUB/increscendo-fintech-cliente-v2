import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/guards';

export const AuthLayout: React.FC = () => (
  <div className="min-h-screen bg-background">
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </div>
);