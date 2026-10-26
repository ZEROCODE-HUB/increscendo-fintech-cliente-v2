import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileText, Lock, Mail, MessageCircle, Phone, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, PageHeader, TextInput } from "../components/ui";

const PHONE = "+52 55 9020 7001";
const EMAIL = "contacto@increscendofintech.com";

const FAQ: { cat: string; q: string; a: string }[] = [
  { cat: "Cuenta", q: "¿Qué documentos necesito para verificar mi identidad?", a: "INE por ambos lados, constancia de situación fiscal (RFC) y un comprobante de domicilio de menos de 3 meses. La CURP es opcional. Los subes una sola vez desde Perfil › Identidad y documentos." },
  { cat: "Cuenta", q: "¿Cuánto tarda la verificación?", a: "Normalmente menos de 24 horas hábiles. Te avisamos por correo y en Notificaciones. Mientras tanto ya puedes activar tu membresía." },
  { cat: "Cuenta", q: "Rechazaron mis documentos, ¿qué hago?", a: "En Identidad verás el motivo y qué documento volver a subir. Toma la foto con buena luz, sin flash y con las 4 esquinas visibles." },
  { cat: "Membresía", q: "¿Cómo pago mi membresía?", a: "Con tarjeta de débito o crédito (se activa al instante), link de pago, transferencia SPEI o efectivo en tiendas. Con SPEI o efectivo se activa cuando recibimos el pago." },
  { cat: "Membresía", q: "¿Cuándo vence mi membresía?", a: "Es anual. La fecha de vencimiento aparece en Inicio y en Membresía. Te avisamos 7 días antes." },
  { cat: "Servicios", q: "¿Cómo pago luz, agua o una recarga?", a: "Entra a Servicios (el botón central en el celular), elige la categoría y sigue los pasos. Al terminar, usa “Volver a Increscendo”." },
  { cat: "Servicios", q: "No veo un pago de servicio en Movimientos", a: "Los pagos de servicios también quedan en el historial de la plataforma de Servicios. Si no aparece en ninguno, escríbenos con la fecha y el monto." },
  { cat: "Préstamos", q: "¿Qué necesito para pedir un préstamo?", a: "Identidad verificada y membresía activa. La solicitud se revisa en menos de 24 horas hábiles; si se aprueba, firmas el contrato en línea y te depositamos." },
  { cat: "Préstamos", q: "¿Puedo adelantar cuotas?", a: "Sí. En el detalle de tu préstamo selecciona las cuotas y confirma el pago." },
  { cat: "Tarjeta", q: "¿Cómo obtengo la tarjeta Increscendo?", a: "Cuando esté disponible para ti te llegará una invitación por correo. Necesitas identidad verificada y membresía activa." },
];

export default function Help() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return FAQ.map((f, i) => ({ ...f, i })).filter((f) => !s || `${f.q} ${f.a} ${f.cat}`.toLowerCase().includes(s));
  }, [q]);
  const cats = Array.from(new Set(rows.map((r) => r.cat)));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Ayuda" subtitle="Respuestas rápidas y formas de contactarnos." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <TextInput icon={<Search />} placeholder="Busca tu duda: membresía, documentos, pagos…" value={q} onChange={(e) => setQ(e.target.value)} />
          {cats.map((c) => (
            <section key={c}>
              <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-slate-400">{c}</h2>
              <Card className="divide-y divide-slate-100 overflow-hidden">
                {rows
                  .filter((r) => r.cat === c)
                  .map((r) => (
                    <div key={r.i}>
                      <button type="button" onClick={() => setOpen(open === r.i ? null : r.i)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
                        <span className="flex-1 text-[14.5px] font-semibold text-slate-900">{r.q}</span>
                        <ChevronDown size={18} className={cn("shrink-0 text-slate-400 transition-transform", open === r.i && "rotate-180")} />
                      </button>
                      {open === r.i && <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{r.a}</p>}
                    </div>
                  ))}
              </Card>
            </section>
          ))}
          {!rows.length && <p className="py-8 text-center text-sm text-slate-500">No encontramos resultados. Escríbenos y te ayudamos.</p>}
        </div>

        <aside className="space-y-4">
          <Card className="relative overflow-hidden border-0 bg-[linear-gradient(150deg,#0d1a2e_0%,#13213a_60%,#123a40_100%)] p-5 text-white">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10" />
            <MessageCircle className="relative text-[#5fd3bb]" />
            <p className="relative mt-3 text-lg font-extrabold">¿Necesitas hablar con alguien?</p>
            <p className="relative mt-1 text-sm text-white/70">Usa el chat (botón en la esquina) o contáctanos directo.</p>
            <div className="relative mt-4 space-y-2">
              <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-semibold hover:bg-white/15">
                <Phone size={16} /> {PHONE}
              </a>
              <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-semibold hover:bg-white/15">
                <Mail size={16} /> <span className="truncate">{EMAIL}</span>
              </a>
            </div>
          </Card>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {[
              { icon: ShieldCheck, t: "Tips de seguridad", to: "/tips-seguridad" },
              { icon: FileText, t: "Términos y condiciones", to: "/terminos-y-condiciones" },
              { icon: FileText, t: "Términos de cancelación", to: "/terminos-cancelacion" },
              { icon: Lock, t: "Aviso de privacidad", to: "/politicas-privacidad" },
            ].map((l) => (
              <a key={l.t} href={l.to} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <l.icon size={17} className="text-slate-400" /> {l.t}
              </a>
            ))}
          </Card>
          <button type="button" onClick={() => navigate("/notifications")} className="w-full text-center text-sm font-semibold text-brand hover:underline">
            Ver mis notificaciones
          </button>
        </aside>
      </div>
    </div>
  );
}
