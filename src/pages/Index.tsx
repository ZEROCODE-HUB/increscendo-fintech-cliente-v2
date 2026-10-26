import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, Zap, BadgeCheck, Wallet, Smartphone, CreditCard, CheckCircle2,
} from "lucide-react";
import heroImage from "@/assets/vitaly-gariev-omGSZqBXkqY-unsplash.jpeg";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Chatbot } from "@/components/Chatbot";

const Index = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [featuresInView, setFeaturesInView] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsInView(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setFeaturesInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="overflow-hidden">

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">

        {/* Dot-grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-60 -right-40 w-[900px] h-[900px] rounded-full bg-success/15 blur-3xl" />
          <div className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-white/[0.04] blur-3xl" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Copy */}
            <div className="space-y-8">
              <div style={{ opacity: 0, animation: 'fade-in-up 0.6s ease-out 0ms both' }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/50 text-success text-xs font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Plataforma 100% Segura y Regulada
                </span>
              </div>

              <div style={{ opacity: 0, animation: 'fade-in-up 0.6s ease-out 130ms both' }}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                  <span className="text-gradient">Increscendo</span><br />
                  <span className="text-success">Fintech</span>
                </h1>
              </div>

              <div style={{ opacity: 0, animation: 'fade-in-up 0.6s ease-out 250ms both' }}>
                <p className="text-base sm:text-lg lg:text-xl text-white/95 max-w-lg leading-relaxed">
                  Paga tus servicios, recarga tiempo aire y accede a beneficios exclusivos con tu membresía.
                </p>
              </div>

              <div style={{ opacity: 0, animation: 'fade-in-up 0.6s ease-out 370ms both' }}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleAccess} size="lg"
                    className="bg-success hover:bg-success/90 text-white shadow-glow-success font-semibold w-full sm:w-auto">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '#features'}
                    className="border-white/50 text-white bg-white/[0.09] hover:bg-white/[0.18] hover:border-white/70 hover:text-white backdrop-blur-sm w-full sm:w-auto">
                    Conocer Más
                  </Button>
                </div>
              </div>
            </div>

            {/* Image with floating badges */}
            <div className="relative hidden lg:block"
              style={{ opacity: 0, animation: 'fade-in-up 0.7s ease-out 200ms both' }}>
              <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-transparent to-primary/30 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-strong">
                <img src={heroImage} alt="Equipo Increscendo"
                  className="object-cover w-full h-[480px]" loading="eager" width={800} height={480} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/10 to-transparent" />
              </div>

              {/* Floating badge — bottom left */}
              <div className="absolute -bottom-5 -left-8 bg-card rounded-xl px-4 py-3 shadow-strong border border-border flex items-center gap-3 animate-float">
                <div className="h-10 w-10 bg-success/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">100% Seguro</p>
                  <p className="text-[10px] text-muted-foreground">Regulado y certificado</p>
                </div>
              </div>

              {/* Floating badge — top right */}
              <div className="absolute -top-5 -right-6 bg-card rounded-xl px-4 py-3 shadow-strong border border-border animate-float"
                style={{ animationDelay: '1.5s' }}>
                <p className="text-xs font-bold text-foreground">+400 Productos</p>
                <p className="text-[10px] text-success font-semibold mt-0.5">Disponibles ahora</p>
              </div>
            </div>
          </div>

          {/* Stats strip with animated counters */}
          <div ref={statsRef}
            className="mt-16 grid grid-cols-3 rounded-2xl overflow-hidden border border-white/10 divide-x divide-white/[0.08]"
            style={{ opacity: 0, animation: 'fade-in-up 0.6s ease-out 490ms both' }}>

            <div className="bg-white/[0.05] backdrop-blur-sm px-6 py-6 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-success">
                {!statsInView ? '+400' : <AnimatedNumber value={400} duration={1600} formatter={n => `+${n}`} />}
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1.5 uppercase tracking-widest font-medium">Productos</p>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-sm px-6 py-6 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-success">
                {!statsInView ? '100%' : <AnimatedNumber value={100} duration={1600} delay={400} formatter={n => `${n}%`} />}
              </p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1.5 uppercase tracking-widest font-medium">Seguro</p>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-sm px-6 py-6 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-success">24/7</p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1.5 uppercase tracking-widest font-medium">Atención</p>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section id="features" className="relative py-24 sm:py-28 md:py-32 px-4 sm:px-6 bg-background">
        {/* Navy tint */}
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-success">Nuestras Soluciones</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">¿Por Qué Increscendo?</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Soluciones integrales que simplifican la vida de nuestros clientes
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

            {/* 01 */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 0ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-success/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">01</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-success opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-success/20 transition-colors duration-300">
                <Shield className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Seguridad de Nivel Bancario</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Protección de datos con encriptación de punta a punta y cumplimiento total de normativas financieras
              </p>
            </div>

            {/* 02 */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 80ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-primary/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">02</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-primary/20 transition-colors duration-300">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Pago de servicios, fácil y rápido</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Paga todos tus servicios de luz, agua, gas, teléfono y más en un mismo lugar.
              </p>
            </div>

            {/* 03 — navy en vez de rojo */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 160ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-primary/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">03</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-primary/20 transition-colors duration-300">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Recarga de tiempo aire en segundos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Realiza todas las recargas de las compañías de telefonía móvil en México de manera segura.
              </p>
            </div>

            {/* 04 */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 240ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-success/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">04</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-success opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-success/20 transition-colors duration-300">
                <BadgeCheck className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Membresías con beneficios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Elige tu membresía y accede a pago de servicios, descuentos y beneficios adicionales.
              </p>
            </div>

            {/* 05 */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 320ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-success/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">05</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-success opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-success/20 transition-colors duration-300">
                <CreditCard className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Tarjeta Internacional (Próximamente)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu tarjeta es aceptada en TPV, compra en Línea, comercios físicos, electrónicos y retiros de efectivo en ATM Internacional
              </p>
            </div>

            {/* 06 */}
            <div style={{ opacity: 0, animation: featuresInView ? 'fade-in-up 0.5s ease-out 400ms both' : 'none' }} className="group relative bg-card border border-border/70 rounded-2xl p-7 hover:border-primary/30 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <span className="absolute -top-2 right-5 text-[7rem] font-black text-foreground/[0.03] select-none leading-none pointer-events-none">06</span>
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="h-14 w-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:bg-primary/20 transition-colors duration-300">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3 text-foreground">Monederos de regalo digitales</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Solicita códigos generados en nuestro sistema y recíbelos por SMS para usar en compras online.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════ ABOUT / TECH ══════════════════════ */}
      <section id="about" className="relative py-24 sm:py-28 md:py-32 px-4 sm:px-6 bg-background">
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div className="relative space-y-6">
              {/* Decorative background "IA" */}
              <div className="absolute -top-6 -left-2 text-[10rem] font-black text-primary/[0.045] select-none leading-none pointer-events-none tracking-tighter">
                IA
              </div>
              <p className="relative text-xs font-semibold uppercase tracking-widest text-success">Tecnología</p>
              <h2 className="relative text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                Tecnología de Vanguardia
              </h2>
              <p className="relative text-sm sm:text-base text-muted-foreground leading-relaxed">
                En Increscendo Fintech combinamos tecnología de punta e inteligencia artificial, con las mejores prácticas para ofrecer soluciones financieras que verdaderamente transformen tu negocio.
              </p>
              <div className="relative">
                <Button onClick={handleAccess} size="lg" className="shadow-medium">
                  Comienza Tu Prueba Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right — services card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-premium rounded-3xl opacity-20 blur-2xl" />
              <div className="relative bg-gradient-hero rounded-2xl p-8 sm:p-10 shadow-strong border border-white/10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <h3 className="relative text-lg sm:text-xl font-bold mb-6 text-white">Servicios Integrados</h3>
                <ul className="relative space-y-3.5">
                  {[
                    "Membresías con beneficios exclusivos",
                    "Pagos de servicios y recargas automatizadas",
                    "Monederos digitales con seguridad bancaria",
                    "Soporte personalizado 24/7 con chatbot inteligente",
                    "Validación de identidad con tecnología OCR",
                    "Link de pagos al instante",
                    "Domiciliación de pagos",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-success/25 border border-success/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-sm text-white/90 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider → CTA */}
        <div className="absolute bottom-0 left-0 right-0" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width: '100%', height: '70px', display: 'block' }}>
            <path d="M0,70 Q720,0 1440,70 L1440,0 L0,0 Z" style={{ fill: 'hsl(216,45%,20%)' }} />
          </svg>
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="relative py-24 sm:py-28 md:py-32 px-4 sm:px-6"
        style={{ boxShadow: '0 1px 0 0 hsl(216,45%,20%)' }}>
        <div className="absolute inset-0 bg-primary" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-success">Empieza hoy</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight px-2">
            ¿Listo Para Transformar Tu Negocio?
          </h2>
          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
            Únete a miles de clientes que ya confían en Increscendo Fintech para gestionar sus operaciones financieras con tecnología de clase mundial
          </p>
          <div className="pt-2">
            <Button size="lg"
              onClick={() => {
                if (!user) { navigate('/auth'); return; }
                navigate(userRole === 'admin' ? '/admin/dashboard' : '/dashboard');
              }}
              className="bg-success hover:bg-success/90 text-white shadow-glow-success font-semibold px-10 w-full sm:w-auto">
              Crear Cuenta Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Chatbot />
    </div>
  );
};

export default Index;
