import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

const ProntipagosSSO = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación SSO con Prontipagos
    
    // Simulación: cerrar ventana y enviar mensaje al parent
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'PRONTIPAGOS_SSO_SUCCESS',
        user: { username }
      }, window.location.origin);
      window.close();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-6 pb-8 pt-12 flex flex-col items-center">
          {/* Logo Prontipagos */}
          <div className="flex items-center justify-center">
            <img 
              src="/logo_prontipagos.webp" 
              alt="Prontipagos" 
              className="h-16 w-auto object-contain"
            />
          </div>
          
          <h2 className="text-2xl font-normal text-gray-700 text-center">
            Ingresa tus datos
          </h2>
        </CardHeader>
        
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Usuario */}
            <div>
              <Input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-base border-gray-300 focus:border-primary"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base border-gray-300 focus:border-primary pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full mt-8"
            >
              Ingresa Ahora
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProntipagosSSO;
