import { PublicHeader } from "@/components/layouts/PublicHeader";
import { PublicFooter } from "@/components/layouts/PublicFooter";
import { Button } from "@/components/ui/button";
import { Mail, Users, Award, Globe } from "lucide-react";

const BolsaTrabajo = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-6">Bolsa de Trabajo</h1>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-5">
              <p className="text-base sm:text-lg text-foreground/90">
                Si tu deseo es pertenecer a nuestro grupo selecto de promotores para incrementar tus ingresos, <strong className="text-primary">esta es tu oportunidad</strong>.
              </p>

              <p className="text-sm text-foreground/80">
                Nuestros promotores constantemente participan en seminarios trimestrales en línea con una descripción de nuestros servicios y nuevos productos disponibles para nuestros clientes.
              </p>

              <div className="grid grid-cols-2 gap-4 py-5">
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
                  <Globe className="h-7 w-7 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Red Nacional</p>
                    <p className="text-xs text-muted-foreground">Promotores en todo el país</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
                  <Award className="h-7 w-7 text-success" />
                  <div>
                    <p className="font-semibold text-sm">Capacitación</p>
                    <p className="text-xs text-muted-foreground">Seminarios trimestrales</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <h2 className="text-base sm:text-lg font-bold text-primary">¡Queremos que seas parte de nuestro equipo!</h2>
                </div>
                <p className="text-sm text-foreground/80 mb-5">
                  Contamos con una amplia red de promotores en todo el país. Envíanos tu CV y únete a la familia Increscendo Fintech.
                </p>
                <Button
                  className="w-full"
                  onClick={() => window.location.href = 'mailto:empleo@increscendofintech.com'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar CV a empleo@increscendofintech.com
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Equipo corporativo de Increscendo Fintech"
                className="rounded-2xl shadow-soft object-cover w-full h-[400px] sm:h-[500px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default BolsaTrabajo;