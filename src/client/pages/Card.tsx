import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowRight, CheckCircle2, Clock3, CreditCard, Crown, Eye, EyeOff, FlaskConical, Globe, Lock, ShieldCheck, Snowflake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, Empty, PageHeader, Pill, Skel } from "../components/ui";
import { CK, useCard, useJourney, useRefresh } from "../hooks";
import { demoActivateCard, updateCard } from "../lib/api";
import { FEATURE_CARDS, IS_DEMO } from "../lib/env";
import { dayMonth, money, shortDate } from "../lib/format";
import type { CardState } from "../lib/types";
import logoLight from "@/assets/logo-light.webp";

export function CardVisual({ card, reveal, className }: { card: Partial<CardState>; reveal?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full max-w-[380px] overflow-hidden rounded-[22px] bg-gradient-to-br from-brand-ink via-brand-navy to-[#1d5c63] p-5 text-white shadow-[0_24px_48px_-20px_rgba(19,33,58,.8)]",
        card.status === "blocked" && "grayscale",
        className,
      )}
    >
      <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-brand-cyan/30 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-brand-accent/30 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <img src={logoLight} alt="Increscendo" className="h-6 w-auto" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">{card.kind === "fisica" ? "Física" : "Digital"}</span>
        </div>
        <div>
          <div className="mb-3 h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80" />
          <p className="font-mono text-[17px] tracking-[.18em]">{reveal ? `5321 0042 8810 ${card.last4 ?? "0000"}` : `•••• •••• •••• ${card.last4 ?? "0000"}`}</p>
          <div className="mt-2 flex items-end justify-between text-[12px]">
            <span className="truncate font-semibold uppercase tracking-wide">{card.holder ?? "TU NOMBRE"}</span>
            <span className="font-mono">{card.expiry ?? "MM/AA"}</span>
          </div>
        </div>
      </div>
      {card.status === "blocked" && (
        <div className="absolute inset-0 grid place-items-center bg-slate-900/40">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-slate-800">
            <Snowflake size={15} /> Bloqueada
          </span>
        </div>
      )}
    </div>
  );
}

export default function CardPage() {
  const j = useJourney();
  const { data: card, isLoading } = useCard();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!FEATURE_CARDS) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Mi tarjeta" />
        <Card className="flex flex-col items-center p-8 text-center">
          <CardVisual card={{ kind: "digital" }} className="max-w-[300px]" />
          <Pill tone="info" className="mt-6">Próximamente</Pill>
          <p className="mt-3 text-lg font-extrabold text-slate-900">Tu tarjeta Increscendo viene en camino</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Te avisaremos cuando puedas solicitarla. Los miembros con identidad verificada tendrán prioridad.</p>
        </Card>
      </div>
    );
  }
  if (isLoading || j.isLoading || !card) return <Skel className="mx-auto h-96 max-w-3xl rounded-2xl" />;

  const act = async (patch: Parameters<typeof updateCard>[0], ok: string) => {
    setBusy(true);
    try {
      await updateCard(patch);
      await refresh(CK.card);
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (card.status === "active" || card.status === "blocked") {
    const blocked = card.status === "blocked";
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Mi tarjeta" />
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="space-y-4">
            <CardVisual card={card} reveal={reveal} />
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: reveal ? EyeOff : Eye, label: reveal ? "Ocultar" : "Ver datos", onClick: () => setReveal((v) => !v), disabled: blocked },
                { icon: blocked ? Lock : Snowflake, label: blocked ? "Desbloquear" : "Bloquear", onClick: () => act({ blocked: !blocked }, blocked ? "Tarjeta desbloqueada." : "Tarjeta bloqueada.") },
                {
                  icon: Globe,
                  label: card.onlinePurchases ? "Compras en línea: sí" : "Compras en línea: no",
                  onClick: () => act({ onlinePurchases: !card.onlinePurchases }, "Preferencia actualizada."),
                  disabled: blocked,
                },
              ].map((a) => (
                <button
                  key={a.label}
                  type="button"
                  disabled={busy || a.disabled}
                  onClick={a.onClick}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <a.icon size={20} className="text-brand" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Card className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-500">Saldo disponible</p>
                <p className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-900">{money(card.balance)}</p>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-500">Línea asignada</p>
                <p className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-900">{money(card.creditLine, 0)}</p>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <p className="border-b border-slate-100 px-5 py-3.5 text-[15px] font-bold text-slate-900">Movimientos de la tarjeta</p>
              {(card.movements ?? []).length ? (
                <ul className="divide-y divide-slate-100">
                  {(card.movements ?? []).map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <span className={cn("grid h-9 w-9 place-items-center rounded-xl", m.direction === "in" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                        {m.direction === "in" ? <ArrowDownLeft size={16} /> : <CreditCard size={16} />}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                        <p className="text-xs text-slate-500">{dayMonth(m.date)}</p>
                      </div>
                      <span className={cn("text-sm font-bold", m.direction === "in" ? "text-emerald-600" : "text-slate-900")}>
                        {m.direction === "in" ? "+" : "−"}
                        {money(m.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty icon={<CreditCard />} title="Sin movimientos todavía" />
              )}
            </Card>
            <p className="px-1 text-xs text-slate-400">¿Robo o extravío? Bloquéala aquí y escríbenos por el chat para reponerla.</p>
          </div>
        </div>
      </div>
    );
  }

  if (card.status === "requested") {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Mi tarjeta" />
        <Card className="flex flex-col items-center p-6 text-center md:p-8">
          <CardVisual card={{ ...card, last4: "••••" }} className="max-w-[300px]" />
          <span className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-600">
            <Clock3 size={24} />
          </span>
          <p className="mt-3 text-lg font-extrabold text-slate-900">Estamos preparando tu tarjeta</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Solicitada el {shortDate(card.requestedAt)}. {card.kind === "fisica" ? "Te avisaremos cuando salga a tu domicilio." : "Te avisaremos cuando esté lista para usarse."}
          </p>
          {IS_DEMO && (
            <Btn
              variant="outline"
              className="mt-6"
              icon={<FlaskConical size={16} />}
              onClick={async () => {
                demoActivateCard();
                await refresh(CK.card);
              }}
            >
              Demo: activar tarjeta
            </Btn>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mi tarjeta" />
      <div className="grid items-center gap-8 rounded-3xl bg-white p-6 md:grid-cols-2 md:p-10">
        <CardVisual card={{ kind: "digital", holder: j.profile ? `${j.profile.firstName} ${j.profile.lastName}` : undefined }} />
        <div>
          <Pill tone={card.status === "invited" ? "brand" : "neutral"}>
            <Sparkles size={12} /> {card.status === "invited" ? "Tienes una invitación" : "Muy pronto"}
          </Pill>
          <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-slate-900">Tu tarjeta Increscendo</h2>
          <p className="mt-2 text-sm text-slate-500">Paga en comercios y en línea, controla tu saldo desde aquí y bloquéala cuando quieras.</p>
          <ul className="mt-5 space-y-2.5">
            <Req ok={j.verified} label="Identidad verificada" icon={ShieldCheck} />
            <Req ok={j.hasMembership} label="Membresía activa" icon={Crown} />
          </ul>
          {card.status === "invited" ? (
            j.canRequestCard ? (
              <Btn size="lg" className="mt-6" onClick={() => navigate("/tarjeta/solicitar")}>
                Solicitar mi tarjeta <ArrowRight size={18} />
              </Btn>
            ) : (
              <Btn size="lg" className="mt-6" onClick={() => navigate(!j.verified ? "/identidad" : "/memberships")}>
                Completar requisitos <ArrowRight size={18} />
              </Btn>
            )
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-500">Te enviaremos una invitación por correo cuando puedas solicitarla.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Req({ ok, label, icon: Icon }: { ok: boolean; label: string; icon: React.ElementType }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Icon size={18} className="text-slate-400" />}
      <span className={ok ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      {!ok && <span className="text-xs font-semibold text-amber-600">Pendiente</span>}
    </li>
  );
}
