import { Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/layouts/PublicHeader";
import { PublicFooter } from "@/components/layouts/PublicFooter";

const helpCategories = [
  {
    icon: "credit-card",
    title: "Membresías y Pagos",
    description: "Información sobre membresías, pago de servicios y recargas.",
    color: "primary"
  },
  {
    icon: "shield",
    title: "Seguridad",
    description: "Protege tu cuenta y aprende sobre nuestras medidas de seguridad.",
    link: "/tips-seguridad",
    color: "success"
  },
  {
    icon: "file-text",
    title: "Documentación Legal",
    description: "Accede a nuestros avisos legales y políticas de privacidad.",
    link: "/aviso-legal",
    color: "danger"
  },
  {
    icon: "help-circle",
    title: "Preguntas Frecuentes",
    description: "Encuentra respuestas a las dudas más comunes de nuestros usuarios.",
    color: "primary"
  },
];

const getIcon = (icon: string, className: string) => {
  switch (icon) {
    case "credit-card":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
    case "shield":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case "file-text":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case "help-circle":
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    default:
      return null;
  }
};

const CentroAyuda = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Centro de Ayuda</h2>
          <p className="text-sm text-muted-foreground ">
            Estamos aquí para ayudarte.
          </p>
          <p className="text-sm text-muted-foreground mb-8">

            Encuentra la información que necesitas o contáctanos directamente.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="p-5 bg-card rounded-xl border border-border hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center mb-4 ${category.color === 'primary' ? 'bg-primary/10' :
                  category.color === 'success' ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                  <div className={category.color === 'primary' ? 'text-primary' : category.color === 'success' ? 'text-success' : 'text-destructive'}>
                    {getIcon(category.icon, "h-5 w-5")}
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-2">{category.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{category.description}</p>
                {category.link && (
                  <Link to={category.link} className="text-primary hover:underline text-xs font-medium">
                    Ver más
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl sm:rounded-2xl text-white">
            <h3 className="text-base sm:text-lg font-semibold mb-6">¿Necesitas ayuda personalizada?</h3>

            <div className="grid sm:grid-cols-3 gap-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5">Teléfono</p>
                  <p className="text-xs text-white/80">+52 55 9020 7001</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5">Email</p>
                  <p className="text-xs text-white/80">contacto@increscendofintech.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5">Horario</p>
                  <p className="text-xs text-white/80">Lun - Vie: 9:00 - 17:00</p>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.href = '/contacto'}
              className="bg-white text-primary hover:bg-white/90"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ir a Contacto
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CentroAyuda;