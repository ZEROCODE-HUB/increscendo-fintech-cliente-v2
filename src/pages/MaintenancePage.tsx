import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, LogIn, ShieldAlert } from 'lucide-react';

interface MaintenancePageProps {
  variant?: 'web' | 'admin';
  message?: string | null;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ variant = 'web', message }) => {
  const isAdmin = variant === 'admin';

  const title = isAdmin ? 'Panel en mantenimiento' : 'Estamos realizando mantenimiento';
  const description = message ?? (isAdmin
    ? 'El panel administrativo está temporalmente deshabilitado. Intenta nuevamente en unos minutos.'
    : 'Estamos trabajando para mejorar la plataforma, vuelve en otro momento');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4 sm:p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <Card className="border-0 bg-card/95 shadow-strong backdrop-blur">
          <CardHeader className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-premium shadow-glow">
              {isAdmin ? <ShieldAlert className="h-8 w-8 text-white" /> : <Wrench className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-xl sm:text-2xl">Increscendo</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              {title}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 text-center space-y-4 sm:px-8">
            {isAdmin && (
              <Badge className="bg-warning text-warning-foreground" variant="secondary">
                Modo mantenimiento activo
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">{description}</p>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenancePage;