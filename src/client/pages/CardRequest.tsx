/**
 * Solicitud de tarjeta (Fase 2, OneCard). Se entra desde la invitación por
 * correo (/tarjeta/invitacion/:token) o desde "Mi tarjeta".
 * Pasos: Bienvenida → Requisitos → Tipo → Titular → Entrega → Confirmar.
 */
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Crown, MapPin, Smartphone, ShieldCheck, Truck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, CheckRow, Field, KV, Notice, PageHeader, Skel, Stepper, TextInput } from "../components/ui";
import { CardVisual } from "./Card";
import { CK, useCard, useJourney, useRefresh } from "../hooks";
import { formatAddress, requestCard } from "../lib/api";
import { FEATURE_CARDS } from "../lib/env";

const STEPS = ["Bienvenida", "Requisitos", "Tipo de tarjeta", "Titular", "Entrega", "Confirmar"];

export default function CardRequest() {
  const j = useJourney();
  const { data: card, isLoading } = useCard();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"digital" | "fisica">("digital");
  const [holder, setHolder] = useState("");
  const [addrOk, setAddrOk] = useState(false);
  const [terms, setTerms] = useState(false);
  const [sending, setSending] = useState(false);

  if (!FEATURE_CARDS) return <Navigate to="/tarjeta" replace />;
  if (isLoading || j.isLoading) return <Skel className="mx-auto h-96 max-w-2xl rounded-2xl" />;
  if (card && card.status !== "invited" && card.status !== "none") return <Navigate to="/tarjeta" replace />;

  const p = j.profile;
  const fullName = holder || (p ? `${p.firstName} ${p.lastName}`.toUpperCase().slice(0, 26) : "");
  const name = STEPS[step];

  const next = async () => {
    if (name === "Requisitos" && !j.canRequestCard) return;
    if (name === "Titular" && fullName.trim().length < 5) return toast.error("Escribe el nombre que irá en tu tarjeta.");
    if (name === "Entrega" && kind === "fisica" && !addrOk) return toast.error("Confirma tu domicilio de entrega.");
    if (name === "Confirmar") {
      if (!terms) return toast.error("Acepta los términos de la tarjeta.");
      setSending(true);
      try {
        await requestCard(kind, fullName, kind === "fisica" ? p?.addressParts ?? undefined : undefined);
        await refresh(CK.card);
        toast.success("¡Solicitud enviada!");
        navigate("/tarjeta", { replace: true });
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setSending(false);
      }
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Solicita tu tarjeta" back="/tarjeta" />
      <Stepper steps={STEPS} current={step} />

      {name === "Bienvenida" && (
        <Card className="flex flex-col items-center p-6 text-center md:p-8">
          <CardVisual card={{ kind, holder: fullName }} className="max-w-[320px]" />
          <h2 className="mt-6 text-xl font-extrabold text-slate-900">Te invitamos a tener tu tarjeta Increscendo</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">Úsala en comercios y en línea, consulta tu saldo y bloquéala desde la app cuando lo necesites. Sin costo de emisión para miembros.</p>
        </Card>
      )}

      {name === "Requisitos" && (
        <Card className="space-y-3 p-5">
          {[
            { ok: j.verified, icon: ShieldCheck, t: "Identidad verificada", to: "/identidad" },
            { ok: j.hasMembership, icon: Crown, t: "Membresía activa", to: "/memberships" },
          ].map((r) => (
            <button key={r.t} type="button" disabled={r.ok} onClick={() => navigate(r.to)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left disabled:bg-emerald-50/50">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", r.ok ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-600")}>
                {r.ok ? <CheckCircle2 size={20} /> : <r.icon size={20} />}
              </span>
              <span className="flex-1 text-[15px] font-bold text-slate-900">{r.t}</span>
              <span className={cn("text-sm font-semibold", r.ok ? "text-emerald-600" : "text-amber-600")}>{r.ok ? "Listo" : "Completar"}</span>
            </button>
          ))}
          {!j.canRequestCard && <Notice tone="warning">Completa los requisitos para continuar con tu solicitud.</Notice>}
        </Card>
      )}

      {name === "Tipo de tarjeta" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: "digital" as const, icon: Smartphone, t: "Digital", d: "Lista en minutos para compras en línea y pagos con el celular." },
            { v: "fisica" as const, icon: Truck, t: "Física", d: "Te la enviamos a tu domicilio en 5 a 10 días hábiles." },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setKind(o.v)}
              className={cn("rounded-2xl border bg-white p-5 text-left transition-all", kind === o.v ? "border-brand ring-2 ring-brand/20" : "border-slate-200 hover:bg-slate-50")}
            >
              <o.icon className={kind === o.v ? "text-brand" : "text-slate-400"} />
              <p className="mt-3 font-bold text-slate-900">{o.t}</p>
              <p className="mt-1 text-[13px] text-slate-500">{o.d}</p>
            </button>
          ))}
        </div>
      )}

      {name === "Titular" && (
        <Card className="space-y-5 p-5">
          <CardVisual card={{ kind, holder: fullName }} className="mx-auto max-w-[300px]" />
          <Field label="Nombre en la tarjeta" hint="Máximo 26 caracteres, sin acentos.">
            <TextInput icon={<User />} value={fullName} onChange={(e) => setHolder(e.target.value.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 26))} />
          </Field>
        </Card>
      )}

      {name === "Entrega" && (
        <Card className="p-5">
          {kind === "digital" ? (
            <p className="text-sm text-slate-600">Tu tarjeta digital aparecerá en esta sección en cuanto esté lista. No necesitamos dirección de envío.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
                <MapPin className="shrink-0 text-brand" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Enviaremos tu tarjeta a:</p>
                  <p className="text-sm text-slate-600">{p?.addressParts ? formatAddress(p.addressParts) : p?.address || "Sin domicilio registrado"}</p>
                </div>
              </div>
              <CheckRow checked={addrOk} onChange={setAddrOk}>
                Confirmo que este es mi domicilio actual.
              </CheckRow>
              <button type="button" onClick={() => navigate("/mi-cuenta")} className="text-sm font-semibold text-brand hover:underline">
                Cambiar domicilio
              </button>
            </div>
          )}
        </Card>
      )}

      {name === "Confirmar" && (
        <div className="space-y-4">
          <Card className="px-5 py-3">
            <KV k="Tipo" v={kind === "fisica" ? "Física" : "Digital"} />
            <KV k="Titular" v={fullName} />
            {kind === "fisica" && <KV k="Entrega" v={<span className="line-clamp-1 max-w-[220px]">{p?.address}</span>} />}
            <KV k="Costo de emisión" v="Sin costo" />
          </Card>
          <CheckRow checked={terms} onChange={setTerms}>
            Acepto los términos y condiciones de uso de la tarjeta Increscendo.
          </CheckRow>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200/70 bg-[#f3f5f8]/95 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {step > 0 && <Btn variant="outline" size="lg" className="px-4" icon={<ArrowLeft size={18} />} onClick={() => setStep(step - 1)} aria-label="Atrás" />}
        <Btn size="lg" block loading={sending} disabled={name === "Requisitos" && !j.canRequestCard} onClick={next}>
          {name === "Confirmar" ? (
            "Solicitar tarjeta"
          ) : (
            <>
              {step === 0 ? "Comenzar" : "Continuar"} <ArrowRight size={18} />
            </>
          )}
        </Btn>
      </div>
    </div>
  );
}
