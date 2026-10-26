import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import logoIcon from "@/assets/logo-icon.webp";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let token = '';
    let refreshToken = '';
    let tokenType = '';

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      token = hashParams.get('access_token') || '';
      refreshToken = hashParams.get('refresh_token') || '';
      tokenType = hashParams.get('type') || '';
    }

    if (!token && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      token = searchParams.get('token') || '';
      token = searchParams.get('access_token') || token;
      refreshToken = searchParams.get('refresh_token') || '';
      tokenType = searchParams.get('type') || '';
    }

    if (!token) {
      setError("Enlace de recuperación inválido. No se encontró token.");
      setIsReady(true);
      return;
    }

    const validateToken = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken,
        });

        if (sessionError && !data.session) {
          console.error('[ResetPassword] setSession error', sessionError);
          setError("No se pudo validar el enlace. Puede que haya expirado.");
          setIsReady(true);
          return;
        }

        setIsReady(true);
      } catch (err) {
        console.error('[ResetPassword] error:', err);
        setError("Error al validar el enlace de recuperación.");
        setIsReady(true);
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
      toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido cambiada exitosamente" });
    } catch (err) {
      console.error('[ResetPassword] error', err);
      setError("Error al restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-accent/30">
        <Card className="shadow-medium border-0 max-w-md w-full">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Enlace inválido</h3>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Ir a iniciar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-accent/30">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1563013544-824ae0b802cf?w=800&q=80)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center p-12">
            <div className="text-center space-y-6 max-w-md">
              <h1 className="text-5xl font-bold text-white uppercase tracking-wide">
                Increscendo Fintech
              </h1>
              <p className="text-xl text-white/90">
                Establece una nueva contraseña segura
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6 sm:mb-8">
            <img src={logoIcon} alt="Increscendo Fintech" className="h-20 sm:h-24 md:h-28 w-20 sm:w-24 md:w-28 rounded-full object-cover shadow-lg" />
          </div>

          {!isSuccess ? (
            <Card className="shadow-medium border-0">
              <CardHeader className="space-y-1 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl">Nueva contraseña</CardTitle>
                <CardDescription>
                  Ingresa tu nueva contraseña para continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-medium border-0">
              <CardContent className="pt-6 px-4 sm:px-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Contraseña actualizada</h3>
                    <p className="text-muted-foreground mt-2">
                      Tu contraseña ha sido cambiada exitosamente
                    </p>
                  </div>
                  <Button onClick={() => navigate("/auth")} className="mt-4">
                    Ir a iniciar sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;