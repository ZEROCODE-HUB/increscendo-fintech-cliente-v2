import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, MessageCircle } from "lucide-react";

const PaymentError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  const returnTo = searchParams.get("returnTo") || "/my-loans";

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md transition-all duration-700 ease-out ${
          showContent 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className={`rounded-full bg-danger/10 p-4 transition-all duration-500 delay-200 ${
              showContent ? "scale-100" : "scale-0"
            }`}
          >
            <div 
              className={`rounded-full bg-danger/20 p-4 transition-all duration-500 delay-300 ${
                showContent ? "scale-100" : "scale-0"
              }`}
            >
              <AlertCircle 
                className={`h-16 w-16 text-danger transition-all duration-500 delay-400 ${
                  showContent ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-2">
          No pudimos procesar tu pago
        </h1>
        <p className="text-center text-muted-foreground mb-8 px-4">
          Hubo un inconveniente con la transacción. Por favor, verifica los fondos de tu tarjeta o intenta con otro método.
        </p>

        {/* Error Details Card */}
        <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Fondos insuficientes en la tarjeta</li>
                <li>Datos de tarjeta incorrectos</li>
                <li>Límite de transacción excedido</li>
                <li>Problema temporal con el banco emisor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(returnTo)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reintentar Pago
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/contacto")}
            className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contactar a Soporte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;
