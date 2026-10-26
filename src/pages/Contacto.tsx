import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PublicHeader } from "@/components/layouts/PublicHeader";
import { PublicFooter } from "@/components/layouts/PublicFooter";

const Contacto = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Nos pondremos en contacto contigo pronto.",
    });
    setFormData({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-lg text-muted-foreground mb-8 flex flex-col gap-1">
            <span>¿Tienes alguna pregunta o comentario?</span>
            <span>Estamos aquí para ayudarte.</span>
            <span>Completa el formulario o contáctanos directamente.</span>

          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-card p-6 sm:p-8 rounded-xl border border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-6">Envíanos un mensaje</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      placeholder="+52 55 1234 5678"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      name="asunto"
                      placeholder="¿En qué podemos ayudarte?"
                      value={formData.asunto}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    rows={5}
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensaje
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-6">Información de Contacto</h2>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Dirección</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Montes Urales 755<br />
                        Colonia Lomas de Chapultepec<br />
                        Alcaldía Miguel Hidalgo<br />
                        CDMX, CP 11000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Teléfono</h3>
                      <p className="text-sm text-muted-foreground">+52 55 9020 7001</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Email</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href="mailto:contacto@increscendofintech.com" className="text-primary hover:underline">contacto@increscendofintech.com</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Horario de Atención</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Servicio: 24/7<br />
                        De lunes a viernes de 9:00 a 17:00 hrs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Contacto;