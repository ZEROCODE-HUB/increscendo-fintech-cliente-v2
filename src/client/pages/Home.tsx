import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  CreditCard,
  Crown,
  FileWarning,
  HandCoins,
  Lock,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Pill, SectionTitle, Skel, Empty } from "../components/ui";
import { MovementRow } from "../components/rows";
import { MovementsTable } from "../components/MovementsTable";
import { MovementDetail } from "./Movements";
import type { Movement } from "../lib/types";
import { useCard, useJourney, useLoans, useMovements } from "../hooks";
import { FEATURE_CARDS } from "../lib/env";
import { greeting, money, shortDate } from "../lib/format";
import { isOpenLoan, KYC_COPY, LOAN_COPY } from "../lib/rules";
import logoIcon from "@/assets/logo-icon-light.webp";

export default function Home() {
  const j = useJourney();
  const { profile, membership } = j;
  const navigate = useNavigate();
  const { data: movements, isLoading: movLoading } = useMovements();
  const { data: loans } = useLoans();
  const { data: card } = useCard();
  const openLoan = (loans ?? []).find((l) => isOpenLoan(l.status));
  const [sel, setSel] = useState<Movement | null>(null);

  if (j.isLoading) return <HomeSkeleton />;

  const actions = [
    { label: "Pagar servicios", icon: Zap, to: "/servicios", tone: "from-brand-accent to-brand" },
    { label: "Recargas", icon: Smartphone, to: "/servicios", tone: "from-[#2ab8d6] to-[#1a8aa6]" },
    { label: "Membresía", icon: Crown, to: "/memberships", tone: "from-[#36588a] to-brand-navy" },
    { label: "Movimientos", icon: ReceiptText, to: "/history", tone: "from-slate-500 to-slate-700" },
    ...(FEATURE_CARDS ? [{ label: "Mi tarjeta", icon: CreditCard, to: "/tarjeta", tone: "from-[#6b5bd2] to-[#4b3fa8]" }] : []),
    ...(j.loanInvited ? [{ label: "Préstamo", icon: HandCoins, to: openLoan ? `/my-loans/${openLoan.id}` : "/prestamos", tone: "from-[#e0912f] to-[#c26e12]" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">{greeting()},</p>
        <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 md:text-[30px]">{profile?.firstName || "Bienvenido"} 👋</h1>
      </div>

      <div className="hidden md:block">
        <SummaryStrip />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <HeroCard />
          <div className="md:hidden">
            <SummaryStrip />
          </div>

          {!j.onboardingDone && <Onboarding />}
          {j.kyc === "rechazado" && j.onboardingDone && <RejectedBanner />}

          <section>
            <SectionTitle>Accesos rápidos</SectionTitle>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-6">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => navigate(a.to)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", a.tone)}>
                    <a.icon size={20} />
                  </span>
                  <span className="text-center text-[12px] font-semibold leading-tight text-slate-700">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle
              action={
                <Link to="/history" className="flex items-center gap-0.5 text-sm font-bold text-brand hover:underline">
                  Ver todo <ChevronRight size={16} />
                </Link>
              }
            >
              Últimos movimientos
            </SectionTitle>
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {movLoading ? (
                <div className="space-y-3 p-4">
                  <Skel className="h-10" />
                  <Skel className="h-10" />
                </div>
              ) : (movements ?? []).length ? (
                <>
                  <div className="hidden lg:block">
                    <MovementsTable rows={(movements ?? []).slice(0, 6)} compact onRowClick={setSel} />
                  </div>
                  <div className="divide-y divide-slate-100 lg:hidden">
                    {(movements ?? []).slice(0, 5).map((m) => (
                      <MovementRow key={m.id} m={m} onClick={() => setSel(m)} />
                    ))}
                  </div>
                </>
              ) : (
                <Empty icon={<ReceiptText />} title="Aún no hay movimientos" text="Aquí verás tus pagos de membresía, servicios y más." />
              )}
            </Card>
          </section>
        </div>

        <aside className="space-y-4">
          {openLoan && openLoan.status !== "active" && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Tu préstamo</p>
                <Pill tone={LOAN_COPY[openLoan.status].tone}>{LOAN_COPY[openLoan.status].label}</Pill>
              </div>
              <p className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900">{money(openLoan.amount, 0)}</p>
              <p className="mt-1 text-sm text-slate-500">Solicitado el {shortDate(openLoan.appliedAt)}</p>
              <Link to={`/my-loans/${openLoan.id}`} className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-brand hover:bg-brand-soft">
                {openLoan.status === "approved" ? "Firmar contrato" : "Ver detalle"} <ArrowRight size={16} />
              </Link>
            </Card>
          )}

          {FEATURE_CARDS && card && card.status !== "active" && card.status !== "blocked" && (
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#4b3fa8] via-[#3a3a92] to-brand-navy p-5 text-white">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
              <Sparkles size={20} className="text-[#c7c0ff]" />
              <p className="mt-3 text-lg font-extrabold">Tarjeta Increscendo</p>
              <p className="mt-1 text-sm text-white/75">
                {card.status === "requested" ? "Recibimos tu solicitud. Te avisaremos cuando esté lista." : "Paga en comercios y en línea con tu tarjeta de membresía."}
              </p>
              <Link
                to="/tarjeta"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-navy hover:bg-white/90"
              >
                {card.status === "invited" ? "Solicitar mi tarjeta" : card.status === "requested" ? "Ver estatus" : "Conocer más"} <ArrowRight size={16} />
              </Link>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Identidad</p>
                <p className="text-xs text-slate-500">{KYC_COPY[j.kyc].help}</p>
              </div>
              <Pill tone={KYC_COPY[j.kyc].tone}>{KYC_COPY[j.kyc].label}</Pill>
            </div>
          </Card>
          {membership?.status === "active" && membership.benefits.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 text-sm font-bold text-slate-900">Tus beneficios</p>
              <ul className="space-y-2.5">
                {membership.benefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm text-slate-600">
                    <BadgeCheck size={17} className="mt-0.5 shrink-0 text-brand" /> {b}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
      <MovementDetail m={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/**
 * "Saldo" en Increscendo: no hay billetera, así que se muestran las tres cifras
 * reales que pidió Héctor (punto 5): saldo de la tarjeta, lo que debe del
 * préstamo y lo pagado este mes. La que no aplica muestra su acción, no un $0.
 */
function SummaryStrip() {
  const j = useJourney();
  const navigate = useNavigate();
  const { data: card } = useCard();
  const { data: loans } = useLoans();
  const { data: movements } = useMovements();
  const loan = (loans ?? []).find((l) => isOpenLoan(l.status));
  const now = new Date();
  const month = (movements ?? []).filter(
    (m) => m.direction === "out" && m.status === "ok" && new Date(m.date).getMonth() === now.getMonth() && new Date(m.date).getFullYear() === now.getFullYear(),
  );
  const paidMonth = month.reduce((a, m) => a + m.amount, 0);

  type Tile = { key: string; icon: React.ElementType; label: string; value: string; sub: string; to: string; muted?: boolean; tone: string };
  const tiles: Tile[] = [];

  const cardActive = card && (card.status === "active" || card.status === "blocked");
  tiles.push({
    key: "card",
    icon: CreditCard,
    label: "Saldo de tu tarjeta",
    value: cardActive ? money(card?.balance) : !FEATURE_CARDS ? "Próximamente" : card?.status === "requested" ? "En preparación" : card?.status === "invited" ? "Solicítala" : "Próximamente",
    sub: cardActive
      ? card?.status === "blocked"
        ? `•••• ${card?.last4} · bloqueada`
        : (card?.balance ?? 0) > 0
          ? `•••• ${card?.last4} · disponible`
          : "Tu tarjeta no tiene saldo"
      : card?.status === "invited"
        ? "Tienes una invitación"
        : "Tarjeta Increscendo",
    to: "/tarjeta",
    muted: !cardActive,
    tone: "from-[#4b3fa8] to-[#2d2a72]",
  });

  if (j.loanInvited) {
    const active = loan && (loan.status === "active" || loan.status === "disbursed");
    tiles.push({
      key: "loan",
      icon: HandCoins,
      label: "Lo que debes",
      value: active ? money(Math.max(0, loan!.totalToPay - loan!.paidAmount)) : loan ? "En proceso" : "$0.00",
      sub: active
        ? `Próxima cuota ${money(loan!.monthlyPayment)} · ${shortDate(loan!.nextPaymentDate)}`
        : loan
          ? "Tu solicitud está en curso"
          : "Sin préstamos activos",
      to: loan ? `/my-loans/${loan.id}` : "/prestamos",
      muted: !active,
      tone: "from-[#e0912f] to-[#b35f0c]",
    });
  }

  tiles.push({
    key: "month",
    icon: ReceiptText,
    label: "Pagado este mes",
    value: money(paidMonth),
    sub: month.length ? `${month.length} pago${month.length > 1 ? "s" : ""} · ${now.toLocaleDateString("es-MX", { month: "long" })}` : "Sin pagos este mes",
    to: "/history",
    tone: "from-brand-accent to-brand",
  });

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:overflow-visible md:px-0" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
      {tiles.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => navigate(t.to)}
          className="flex min-w-[78%] snap-start items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md md:min-w-0 md:p-5"
        >
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", t.tone)}>
            <t.icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{t.label}</p>
            <p className={cn("truncate font-extrabold tracking-tight tabular-nums", t.muted ? "text-[17px] text-slate-700" : "text-[22px] text-slate-900")}>{t.value}</p>
            <p className="truncate text-xs text-slate-500">{t.sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function HeroCard() {
  const { membership, hasMembership, membershipPending, canBuyMembership } = useJourney();
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-brand-navy to-[#1d5c63] p-5 text-white shadow-[0_18px_40px_-18px_rgba(28,46,74,.7)] md:p-7">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-cyan/25 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-brand-accent/25 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white/70">Tu membresía</p>
          <p className="mt-1 text-[26px] font-extrabold tracking-tight md:text-[32px]">
            {hasMembership ? membership?.planName : membershipPending ? "Pago pendiente" : "Sin membresía"}
          </p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
          <img src={logoIcon} alt="" className="h-7 w-7" />
        </span>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        {hasMembership ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Activa
            </span>
            <span className="text-xs text-white/70">Vence el {shortDate(membership?.expiresAt)}</span>
          </>
        ) : membershipPending ? (
          <span className="text-sm text-white/75">En cuanto recibamos tu pago se activará automáticamente.</span>
        ) : (
          <span className="text-sm text-white/75">Actívala para pagar servicios sin comisión y obtener beneficios exclusivos.</span>
        )}
      </div>
      <div className="relative mt-5 flex gap-2.5">
        {hasMembership ? (
          <button
            type="button"
            onClick={() => navigate("/memberships")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold backdrop-blur hover:bg-white/25"
          >
            Ver beneficios <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(canBuyMembership ? "/memberships" : "/identidad")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-navy hover:bg-white/90"
          >
            {membershipPending ? "Ver referencia de pago" : canBuyMembership ? "Elegir membresía" : "Comenzar"} <ArrowRight size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/servicios")}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold backdrop-blur hover:bg-white/25"
        >
          <Zap size={16} /> Servicios
        </button>
      </div>
    </div>
  );
}

function Onboarding() {
  const j = useJourney();
  const navigate = useNavigate();
  const idDone = j.kyc === "verificado" || j.kyc === "por_verificar";
  const steps = [
    {
      n: 1,
      title: "Verifica tu identidad",
      text:
        j.kyc === "rechazado"
          ? j.profile?.kyc.reasonMessage || "Revisa los documentos marcados y vuelve a subirlos."
          : j.kyc === "por_verificar"
            ? "Documentos enviados. Los revisamos en menos de 24 h hábiles."
            : j.kyc === "verificado"
              ? "Listo, tu identidad está verificada."
              : `INE, RFC y comprobante de domicilio · ${j.docsCount} de ${j.docsTotal}`,
      done: idDone,
      icon: j.kyc === "rechazado" ? FileWarning : j.kyc === "por_verificar" ? Clock3 : ShieldCheck,
      tone: j.kyc === "rechazado" ? "danger" : j.kyc === "por_verificar" ? "info" : idDone ? "success" : "warning",
      cta: j.kyc === "rechazado" ? "Corregir" : idDone ? undefined : "Subir",
      to: "/identidad",
      locked: false,
    },
    {
      n: 2,
      title: "Activa tu membresía",
      text: j.hasMembership
        ? "Tu membresía está activa."
        : j.membershipPending
          ? "Estamos esperando tu pago."
          : j.canBuyMembership
            ? "Elige el plan que más te convenga."
            : "Disponible en cuanto subas tus documentos.",
      done: j.hasMembership,
      icon: Crown,
      tone: j.hasMembership ? "success" : "brand",
      cta: j.hasMembership ? undefined : j.canBuyMembership ? "Elegir" : undefined,
      to: "/memberships",
      locked: !j.canBuyMembership,
    },
  ] as const;

  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-bold text-slate-900">Completa tu cuenta</p>
        <span className="text-xs font-bold text-slate-400">{steps.filter((s) => s.done).length} de 2</span>
      </div>
      <div className="space-y-2.5">
        {steps.map((s) => (
          <button
            key={s.n}
            type="button"
            disabled={s.locked}
            onClick={() => navigate(s.to)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
              s.done ? "border-emerald-100 bg-emerald-50/50" : s.tone === "danger" ? "border-red-200 bg-red-50/50" : "border-slate-200 hover:bg-slate-50",
              s.locked && "opacity-60",
            )}
          >
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                s.done ? "bg-emerald-500 text-white" : s.tone === "danger" ? "bg-red-100 text-red-600" : s.tone === "info" ? "bg-sky-100 text-sky-600" : "bg-brand-soft text-brand",
              )}
            >
              {s.done ? <BadgeCheck size={20} /> : s.locked ? <Lock size={18} /> : <s.icon size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paso {s.n}</p>
              <p className="text-[15px] font-bold text-slate-900">{s.title}</p>
              <p className={cn("text-[13px]", s.tone === "danger" ? "text-red-600" : "text-slate-500")}>{s.text}</p>
            </div>
            {s.cta && <span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">{s.cta}</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}

function RejectedBanner() {
  const { profile } = useJourney();
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/identidad")} className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
      <FileWarning className="shrink-0 text-red-600" size={22} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-red-800">Necesitamos que corrijas un documento</p>
        <p className="text-[13px] text-red-700">{profile?.kyc.reasonMessage || "Revisa tus documentos de identidad."}</p>
      </div>
      <ChevronRight className="text-red-400" size={18} />
    </button>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <Skel className="h-12 w-48" />
      <Skel className="h-48 rounded-3xl" />
      <Skel className="h-32 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
