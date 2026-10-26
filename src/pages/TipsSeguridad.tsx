import { PublicHeader } from "@/components/layouts/PublicHeader";
import { PublicFooter } from "@/components/layouts/PublicFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, AlertTriangle, Mail } from "lucide-react";

const fraudTypes = [
  {
    id: "smishing",
    title: "SMISHING",
    content: "Por medio de un SMS o mensajes de texto simulan ser de una institución financiera o Banco para robar tus datos."
  },
  {
    id: "pharming",
    title: "PHARMING",
    content: "Te redireccionan a una página web falsa mediante ventanas emergentes para robar tu información."
  },
  {
    id: "correo-basura",
    title: "CORREO BASURA",
    content: "Te envían un correo que te invita a visitar una página web o descargar un archivo, que es un virus que roba la información de tu dispositivo y/o computadora."
  },
  {
    id: "tallado-tarjeta",
    title: "TALLADO DE TARJETA",
    content: "Al acudir al cajero, alguien se ofrece ayudarte y te dice que está fallando tu tarjeta, que debes limpiarla para que le lea correctamente, y aprovechar para cambiarla por otra tarjeta."
  },
  {
    id: "trashing",
    title: "TRASHING",
    content: "Buscan en los basureros información tuya y/o documentación que contiene información personal que utilizan para hacer algún tipo de fraude financiero."
  },
  {
    id: "robo-identidad",
    title: "ROBO DE IDENTIDAD",
    content: "Obtienen tus datos personales y los usan para hacerse pasar por ti y sacar créditos y/o ciertos beneficios para algún tipo de fraude bancario o financiero."
  },
  {
    id: "creditos-express",
    title: "CRÉDITOS EXPRESS",
    content: "Te ofrecen prestarte dinero de forma rápida con pocos requisitos pero piden por adelantado uno o varios depósitos logrando desaparecer con tu dinero."
  },
  {
    id: "piramides",
    title: "PIRÁMIDES FINANCIERAS",
    content: "Te ofrecen invertir en un esquemas con rendimientos extremadamente altos y atractivos con la condición de que invites a más personas a unirse, y al final del tiempo no obtienes los recursos prometidos, ni tu propio dinero."
  },
  {
    id: "clonacion-tarjetas",
    title: "CLONACIÓN DE TARJETAS",
    content: "Se llevan a cabo cuando pierdes de vista tus tarjetas. Son clonadas con ayuda de un skimmer, un dispositivo pequeño y fácil de esconder para clonar la información de tus tarjetas."
  },
  {
    id: "alteracion-cheque",
    title: "ALTERACIÓN DE CHEQUE",
    content: "Se ofrecen formarse por ti en la fila del banco o asistir a la financiera para cambiar tu cheque con la finalidad de no perder mucho tiempo y terminan alterando el cheque o endosados a su nombre para cobrarlo a la brevedad."
  },
  {
    id: "extorsion-domicilio",
    title: "EXTORSIÓN EN DOMICILIO",
    content: "Son expertos delincuencia que acuden a tu casa y dicen ser empleados del banco o de la financiera, para pedirte tus datos personales y hacer fraude posterior con tu información."
  },
  {
    id: "phishing",
    title: "PHISHING",
    content: "Hace referencia al acto de «Pescar» los usuarios mediante «anzuelos» (Trampas). Utilizan un correo electrónico para simular ser una institución financiera o Banco para robar tus datos e información personal."
  },
  {
    id: "vishing",
    title: "VISHING",
    content: "Utilizan las llamadas telefónicas para simular ser una institución financiera o Banco y robar tus datos personales."
  },
];

const TipsSeguridad = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-6">Tips de Seguridad</h1>

          <div className="flex items-center gap-3 mb-8 p-4 bg-danger/10 rounded-lg border border-danger/20">
            <AlertTriangle className="h-8 w-8 text-danger flex-shrink-0" />
            <p className="text-base font-medium">
              Conoce los tipos de fraude más comunes y protégete de los ciberdelincuentes
            </p>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-primary mb-6">Tipos de Fraude Más Comunes</h2>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {fraudTypes.map((fraud) => (
              <AccordionItem key={fraud.id} value={fraud.id} className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="text-sm sm:text-base font-semibold tracking-wide text-foreground">
                    {fraud.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {fraud.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 p-5 sm:p-6 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-success" />
              <h2 className="text-base sm:text-lg font-bold text-success">Tips de Seguridad Recomendados</h2>
            </div>
            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Mantén actualizado el antivirus de tu computadora.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Cambia regularmente tu contraseña.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                Nunca compartas tus contraseñas o códigos de acceso a tu cuenta, ya que son tu forma de identificarte en línea.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                No ingreses enlaces de correo electrónico que NO estén correctamente identificados por la institución financiera.
              </li>
            </ul>
          </div>

          <div className="mt-8 p-5 sm:p-6 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-base sm:text-lg font-bold text-primary mb-3">¡Pongámosle un alto al fraude!</h3>
            <p className="text-sm text-foreground/90 mb-4">
              Ningún promotor de nuestra empresa está autorizado a cobrar alguna comisión o cantidad a cambio de cualquiera de nuestros servicios.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Si tienes dudas contáctanos vía mail a: </span>
              <a href="mailto:contacto@increscendofintech.com" className="text-primary hover:underline font-medium">
                contacto@increscendofintech.com
              </a>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-muted-foreground">
              El único sitio oficial de Increscendo Fintech es <a href="https://increscendofintech.com" className="text-primary hover:underline">https://increscendofintech.com</a> y solo contamos con oficinas corporativas en la CDMX, México.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TipsSeguridad;