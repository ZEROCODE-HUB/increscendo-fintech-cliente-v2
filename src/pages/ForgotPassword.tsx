import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { translateError } from "@/lib/errorMessages";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import logoIcon from "@/assets/logo-icon.webp";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Por favor ingresa tu correo electrónico", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({ title: "Error", description: translateError(error.message), variant: "destructive" });
        return;
      }

      setIsSent(true);
    } catch (err) {
      console.error('[ForgotPassword] error', err);
      toast({ title: "Error", description: "Error al enviar el enlace de recuperación", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-accent/30">
      {/* Left side - Hero Image */}
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
                Recupera el acceso a tu cuenta de forma segura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img src={logoIcon} alt="Increscendo Fintech" className="h-20 sm:h-24 md:h-28 w-20 sm:w-24 md:w-28 rounded-full object-cover shadow-lg" />
          </div>

          {!isSent ? (
            <Card className="shadow-medium border-0">
              <CardHeader className="space-y-1 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl">¿Olvidaste tu contraseña?</CardTitle>
                <CardDescription>
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </form>

                <div className="flex items-center justify-center mt-4">
                  <Link
                    to="/auth"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a iniciar sesión
                  </Link>
                </div>
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
                    <h3 className="text-xl font-semibold">Correo enviado</h3>
                    <p className="text-muted-foreground mt-2">
                      Hemos enviado un enlace de recuperación a <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Revisa tu bandeja de entrada y sigue las instrucciones. Si no lo encuentras, revisa tu carpeta de spam.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/auth")}>
                    Volver a iniciar sesión
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

export default ForgotPassword;