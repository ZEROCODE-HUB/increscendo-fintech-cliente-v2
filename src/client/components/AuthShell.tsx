/**
 * Marco de las pantallas de acceso.
 * Escritorio: panel de marca a la izquierda (gradiente, tarjeta de muestra y
 * propuestas de valor) + formulario a la derecha. Móvil: encabezado con
 * gradiente y el formulario en una hoja blanca redondeada.
 */
import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, Crown, Sparkles, Zap } from "lucide-react";
import logoLight from "@/assets/logo-light.webp";
import logoIcon from "@/assets/logo-icon-light.webp";

const VALUE_PROPS = [
  { icon: Zap, title: "Paga luz, agua, gas y recargas en segundos" },
  { icon: Crown, title: "Beneficios exclusivos con tu membresía" },
  { icon: CreditCard, title: "Tu tarjeta Increscendo", soon: true },
];

function SampleCard() {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/[.16] bg-white/[.07] p-6 shadow-[0_30px_70px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-cyan/25 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/75">Membresía Premier</span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
          <img src={logoIcon} alt="" className="h-6 w-6" />
        </span>
      </div>
      <p className="relative mt-4 text-[28px] font-extrabold tracking-tight text-white">Activa</p>
      <p className="relative text-[13px] text-white/70">12 beneficios disponibles</p>
      <div className="relative mt-5 flex items-center justify-between">
        <span className="font-mono text-sm tracking-[.2em] text-white/80">•••• •••• •••• 2481</span>
        <span className="text-sm font-extrabold tracking-wide text-white">INCRESCENDO</span>
      </div>
    </div>
  );
}

/** Círculos de fondo: brillos suaves + anillos con borde fino (estilo Burxia). */
export function BrandRings({ compact }: { compact?: boolean }) {
  const k = compact ? 0.55 : 1;
  const px = (n: number) => `${Math.round(n * k)}px`;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute rounded-full bg-brand-cyan/[.14] blur-[110px]" style={{ width: px(460), height: px(460), right: px(-140), top: px(-150) }} />
      <div className="absolute rounded-full bg-brand-accent/[.16] blur-[110px]" style={{ width: px(380), height: px(380), left: px(-120), bottom: px(-130) }} />
      <div className="absolute rounded-full border border-white/[.09]" style={{ width: px(560), height: px(560), right: px(-230), top: px(-230) }} />
      <div className="absolute rounded-full border border-white/[.07]" style={{ width: px(380), height: px(380), right: px(-140), top: px(-140) }} />
      <div className="absolute rounded-full border border-white/[.05] bg-white/[.015]" style={{ width: px(220), height: px(220), right: px(-60), top: px(-60) }} />
      <div className="absolute rounded-full border border-white/[.06]" style={{ width: px(420), height: px(420), left: px(-210), bottom: px(-210) }} />
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-1 overflow-hidden bg-[linear-gradient(150deg,#070f1c_0%,#0d1a2e_38%,#13213a_68%,#123a40_100%)] lg:flex">
      <BrandRings />
      <div className="relative mx-auto flex w-full max-w-[600px] flex-col justify-between px-12 py-12">
        <img src={logoLight} alt="Increscendo Fintech" className="h-10 w-auto self-start" />
        <div className="space-y-7">
          <div>
            <h2 className="text-balance text-[clamp(32px,2.7vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
              Tus servicios, tu membresía y tu tarjeta en un solo lugar.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Paga lo de todos los días, aprovecha tus beneficios y lleva el control de todo desde una sola cuenta.
            </p>
          </div>
          <SampleCard />
          <ul className="space-y-3">
            {VALUE_PROPS.map((p) => (
              <li key={p.title} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/[.14] text-white">
                  <p.icon size={16} />
                </span>
                <span className="text-[14.5px] font-semibold text-white/90">{p.title}</span>
                {p.soon && (
                  <span className="rounded-full bg-brand-cyan/25 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8fe3f5]">
                    Próximamente
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/45">© {new Date().getFullYear()} Increscendo Fintech · Financial &amp; Services</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, label: "Servicios y recargas", from: "from-[#23957e]", to: "to-[#1d7c69]" },
  { icon: Crown, label: "Beneficios de membresía", from: "from-[#2a4a77]", to: "to-[#1c2e4a]" },
  { icon: Sparkles, label: "Tarjeta Increscendo", from: "from-[#25b3d1]", to: "to-[#1a8aa6]" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showFeatures,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showFeatures?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-white">
      <AuthBrandPanel />
      <div className="flex min-h-[100dvh] w-full flex-col lg:w-[560px] lg:shrink-0">
        {/* Encabezado móvil */}
        <div className="relative overflow-hidden bg-[linear-gradient(150deg,#070f1c_0%,#0d1a2e_40%,#13213a_70%,#123a40_100%)] px-5 pb-14 pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden">
          <BrandRings compact />
          <Link to="/" className="relative inline-block">
            <img src={logoLight} alt="Increscendo Fintech" className="h-8 w-auto" />
          </Link>
          <h1 className="relative mt-6 text-[26px] font-extrabold leading-tight tracking-tight text-white">{title}</h1>
          {subtitle && <p className="relative mt-1 text-sm text-white/70">{subtitle}</p>}
        </div>

        <div className="relative -mt-8 flex flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 lg:mt-0 lg:justify-center lg:rounded-none lg:px-14 lg:py-12">
          {showFeatures && (
            <div className="mb-6 grid grid-cols-3 gap-2.5 lg:hidden">
              {FEATURES.map((f) => (
                <div key={f.label} className={`flex h-[84px] flex-col justify-between rounded-2xl bg-gradient-to-b ${f.from} ${f.to} p-3 text-white shadow-md`}>
                  <f.icon size={20} />
                  <span className="text-[11.5px] font-semibold leading-tight">{f.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-7 hidden lg:block">
              <h1 className="text-[30px] font-extrabold tracking-[-0.02em] text-slate-900">{title}</h1>
              {subtitle && <p className="mt-1 text-[15px] text-slate-500">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mx-auto mt-8 w-full max-w-[420px] text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
