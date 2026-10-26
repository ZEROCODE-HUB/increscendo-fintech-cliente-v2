import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarClock, Check, Clock3, Crown, RefreshCw, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, Notice, PageHeader, Pill, Skel } from "../components/ui";
import { useJourney, usePlans } from "../hooks";
import { money, shortDate } from "../lib/format";
import type { Plan } from "../lib/types";

export default function Memberships() {
  const j = useJourney();
  const { data: plans, isLoading } = usePlans();
  const navigate = useNavigate();
  const m = j.membership;
  const choose = (p: Plan) => navigate(`/membership-checkout?plan=${p.id}`);

  return (
    <div>
      <PageHeader
        title="Membresía"
        subtitle={j.hasMembership ? "Tu plan y tus beneficios." : "Elige el plan que más te conviene. Se paga una vez al año."}
      />

      {j.hasMembership && m && (
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-brand-navy to-[#1d5c63] p-6 text-white">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-brand-cyan/25 blur-3xl" />
            <div className="relative flex items-center gap-2 text-sm font-semibold text-white/75">
              <Crown size={16} /> Tu membresía
            </div>
            <p className="relative mt-1 text-[32px] font-extrabold tracking-tight">{m.planName}</p>
            <div className="relative mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Activa
              </span>
              {m.autoRenew && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
                  <RefreshCw size={12} /> Renovación automática
                </span>
              )}
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60">Desde</p>
                <p className="font-bold">{shortDate(m.startedAt)}</p>
              </div>
              <div>
                <p className="text-white/60">Vence</p>
                <p className="font-bold">{shortDate(m.expiresAt)}</p>
              </div>
            </div>
          </div>
          <Card className="p-5">
            <p className="mb-3 text-sm font-bold text-slate-900">Incluye</p>
            <ul className="space-y-2.5">
              {m.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm text-slate-600">
                  <BadgeCheck size={17} className="mt-0.5 shrink-0 text-brand" /> {b}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {j.membershipPending && (
        <div className="mb-6">
          <Notice tone="warning" title="Tu pago está pendiente">
            Generaste una referencia para la membresía {m?.planName}. Se activará en cuanto recibamos el pago (puede tardar hasta 24 h si pagaste en efectivo).
          </Notice>
        </div>
      )}

      {m?.status === "expired" && (
        <div className="mb-6">
          <Notice tone="danger" title="Tu membresía venció">
            Renueva para seguir disfrutando de tus beneficios.
          </Notice>
        </div>
      )}

      {!j.hasMembership && !j.canBuyMembership && (
        <div className="mb-6">
          <Notice
            tone="info"
            title="Antes de pagar, sube tus documentos"
            action={
              <Btn size="sm" onClick={() => navigate("/identidad")}>
                Subir documentos <ArrowRight size={15} />
              </Btn>
            }
          >
            Solo necesitamos tu INE, RFC y comprobante de domicilio. No tienes que esperar la aprobación para activar tu membresía.
          </Notice>
        </div>
      )}

      <h2 className="mb-4 text-[15px] font-bold text-slate-900">{j.hasMembership ? "Otros planes" : "Planes disponibles"}</h2>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(plans ?? []).map((p) => {
            const current = j.hasMembership && m?.planId === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-white p-6 transition-shadow hover:shadow-lg",
                  p.highlighted ? "border-brand shadow-[0_12px_32px_-16px_rgba(29,124,105,.55)]" : "border-slate-200/80",
                )}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Recomendado</span>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold text-slate-900">{p.name}</p>
                  {p.audience && <Pill>{p.audience}</Pill>}
                </div>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                <p className="mt-5">
                  <span className="text-[34px] font-extrabold tracking-tight text-slate-900">{money(p.price, 0)}</span>
                  <span className="text-sm font-semibold text-slate-400"> {p.currency} / {p.period.toLowerCase()}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm text-slate-600">
                      <Check size={17} className="mt-0.5 shrink-0 text-brand" strokeWidth={2.5} /> {b}
                    </li>
                  ))}
                </ul>
                <Btn
                  className="mt-6"
                  block
                  size="lg"
                  variant={current ? "outline" : p.highlighted ? "primary" : "navy"}
                  disabled={current || j.membershipPending}
                  onClick={() => choose(p)}
                >
                  {current ? "Tu plan actual" : j.hasMembership ? `Cambiar a ${p.name}` : `Elegir ${p.name}`}
                </Btn>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldAlert, t: "Pago seguro", d: "Con tarjeta, link de pago, SPEI o efectivo." },
          { icon: CalendarClock, t: "Pago anual", d: "Te avisamos 7 días antes de que venza." },
          { icon: Clock3, t: "Activación inmediata", d: "Con tarjeta, tu membresía queda activa al instante." },
        ].map((x) => (
          <div key={x.t} className="flex gap-3 rounded-2xl bg-white/70 p-4">
            <x.icon size={20} className="shrink-0 text-brand" />
            <div>
              <p className="text-sm font-bold text-slate-900">{x.t}</p>
              <p className="text-[13px] text-slate-500">{x.d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
