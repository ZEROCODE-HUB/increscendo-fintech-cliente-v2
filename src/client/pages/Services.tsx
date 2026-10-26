import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Droplets, Flame, Gift, Landmark, Loader2, Smartphone, Sparkles, Tv, Wifi, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, PageHeader } from "../components/ui";
import { useJourney } from "../hooks";
import { getServicesUrl } from "../lib/api";

export const SERVICES_EMBED_STORAGE_KEY = "services_embed_url";

const CATS = [
  { id: "luz", label: "Luz", icon: Zap, c: "bg-amber-50 text-amber-600" },
  { id: "agua", label: "Agua", icon: Droplets, c: "bg-sky-50 text-sky-600" },
  { id: "gas", label: "Gas", icon: Flame, c: "bg-orange-50 text-orange-600" },
  { id: "recargas", label: "Recargas", icon: Smartphone, c: "bg-emerald-50 text-emerald-600" },
  { id: "internet", label: "Internet", icon: Wifi, c: "bg-indigo-50 text-indigo-600" },
  { id: "tv", label: "TV de paga", icon: Tv, c: "bg-fuchsia-50 text-fuchsia-600" },
  { id: "gobierno", label: "Gobierno", icon: Landmark, c: "bg-slate-100 text-slate-600" },
  { id: "giftcards", label: "Gift cards", icon: Gift, c: "bg-rose-50 text-rose-600" },
];

export function useOpenServices() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState<string | null>(null);
  const open = async (id = "all") => {
    if (opening) return;
    setOpening(id);
    try {
      const url = await getServicesUrl();
      sessionStorage.setItem(SERVICES_EMBED_STORAGE_KEY, url);
      navigate("/servicios-recargas");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpening(null);
    }
  };
  return { open, opening };
}

export default function Services() {
  const { hasMembership } = useJourney();
  const { open, opening } = useOpenServices();
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Servicios" subtitle="Paga tus recibos y haz recargas en segundos." />

      <button
        type="button"
        onClick={() => open()}
        className="group relative mb-6 flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-accent via-brand to-brand-dark p-5 text-left text-white shadow-[0_16px_36px_-18px_rgba(29,124,105,.9)] md:p-6"
      >
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20">
          {opening === "all" ? <Loader2 className="animate-spin" /> : <Zap size={26} />}
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="text-lg font-extrabold">Pagar un servicio o recarga</p>
          <p className="text-sm text-white/80">Más de 300 empresas: CFE, Telmex, Telcel, Izzi, SAT y más.</p>
        </div>
        <ArrowRight className="relative shrink-0 transition-transform group-hover:translate-x-1" />
      </button>

      <h2 className="mb-3 text-[15px] font-bold text-slate-900">Categorías</h2>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => open(c.id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={cn("grid h-11 w-11 place-items-center rounded-xl", c.c)}>
              {opening === c.id ? <Loader2 size={20} className="animate-spin" /> : <c.icon size={20} />}
            </span>
            <span className="text-center text-[12px] font-semibold leading-tight text-slate-700">{c.label}</span>
          </button>
        ))}
      </div>

      {!hasMembership && (
        <Card className="mt-6 flex items-center gap-4 p-5">
          <Sparkles className="shrink-0 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Paga sin comisión con tu membresía</p>
            <p className="text-[13px] text-slate-500">Actívala y ahorra en cada pago.</p>
          </div>
          <button type="button" onClick={() => navigate("/memberships")} className="text-sm font-bold text-brand hover:underline">
            Ver planes
          </button>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">Los pagos de servicios se procesan con nuestro aliado Tekae. Al terminar, vuelve con “Volver a Increscendo”.</p>
    </div>
  );
}
