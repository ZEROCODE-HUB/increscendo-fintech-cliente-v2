import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Btn } from "../components/ui";
import { IS_DEMO } from "../lib/env";
import { SERVICES_EMBED_STORAGE_KEY, useOpenServices } from "./Services";
import logoIcon from "@/assets/logo-icon-color.webp";

export default function ServicesEmbed() {
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const { open, opening } = useOpenServices();

  useEffect(() => {
    const stored = sessionStorage.getItem(SERVICES_EMBED_STORAGE_KEY);
    if (!stored) navigate("/servicios", { replace: true });
    else setUrl(stored);
  }, [navigate]);

  useEffect(() => {
    if (!url || loaded) return;
    const t = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(t);
  }, [url, loaded]);

  const back = () => {
    sessionStorage.removeItem(SERVICES_EMBED_STORAGE_KEY);
    navigate("/servicios");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 md:h-16 md:px-5">
        <button type="button" onClick={back} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-slate-200">
          <ArrowLeft size={17} /> <span className="hidden sm:inline">Volver a</span> Increscendo
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="truncate text-sm font-bold text-slate-900">Servicios y recargas</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">Conexión segura con Tekae</p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-emerald-600 sm:inline-flex">
          <ShieldCheck size={15} /> Seguro
        </span>
        <img src={logoIcon} alt="" className="h-8 w-8 sm:hidden" />
      </header>
      <div className="relative min-h-0 flex-1 bg-slate-50">
        {IS_DEMO ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="max-w-sm">
              <img src={logoIcon} alt="" className="mx-auto h-14 w-14" />
              <p className="mt-4 font-bold text-slate-900">Aquí se muestra la plataforma de pagos de Tekae</p>
              <p className="mt-1 text-sm text-slate-500">En modo demostración no se abre la conexión real.</p>
            </div>
          </div>
        ) : (
          <>
            {!loaded && !timedOut && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto animate-spin text-brand" size={32} />
                  <p className="mt-3 text-sm text-slate-500">Conectando con Servicios…</p>
                </div>
              </div>
            )}
            {timedOut && !loaded && (
              <div className="absolute inset-0 grid place-items-center p-6">
                <div className="max-w-sm text-center">
                  <AlertTriangle className="mx-auto text-amber-500" size={32} />
                  <p className="mt-3 font-bold text-slate-900">Está tardando más de lo normal</p>
                  <p className="mt-1 text-sm text-slate-500">Tu sesión con Servicios pudo haber expirado.</p>
                  <Btn className="mt-4" loading={!!opening} onClick={() => open()}>
                    Reintentar
                  </Btn>
                </div>
              </div>
            )}
            {url && <iframe src={url} title="Servicios y recargas" className="h-full w-full border-0" onLoad={() => setLoaded(true)} allow="payment" />}
          </>
        )}
      </div>
    </div>
  );
}
