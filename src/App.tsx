import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { invalidateMaintenanceCache } from '@/services/settingsService';
import { supabase } from '@/lib/supabase';
import { ChunkLoadErrorBoundary } from '@/components/ChunkLoadErrorBoundary';
import router from './app/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        invalidateMaintenanceCache();
        void router.revalidate();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ChunkLoadErrorBoundary>
            <RouterProvider router={router} />
          </ChunkLoadErrorBoundary>
          <Toaster />
          <SonnerToaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;