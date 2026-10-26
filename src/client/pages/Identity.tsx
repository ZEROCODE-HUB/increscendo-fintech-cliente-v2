import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Camera, CheckCircle2, FileText, Home, IdCard, Loader2, Lock, RefreshCw, ScrollText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Card, Field, Notice, PageHeader, Pill, Skel, TextInput } from "../components/ui";
import { CK, useJourney, useRefresh } from "../hooks";
import { REQUIRED_DOCS, updateProfile, uploadDocument } from "../lib/api";
import { isValidRfc } from "../lib/format";
import { KYC_COPY } from "../lib/rules";
import type { DocKey } from "../lib/types";

export const DOCS: { key: DocKey; title: string; text: string; icon: React.ElementType }[] = [
  { key: "ineFront", title: "INE · frente", text: "Foto clara, sin reflejos y con las 4 esquinas visibles.", icon: IdCard },
  { key: "ineBack", title: "INE · reverso", text: "Que se lea el código de barras / QR.", icon: IdCard },
  { key: "rfc", title: "Constancia de situación fiscal (RFC)", text: "PDF del SAT con antigüedad menor a 3 meses.", icon: ScrollText },
  { key: "addressProof", title: "Comprobante de domicilio", text: "Luz, agua, teléfono o predial, no mayor a 3 meses.", icon: Home },
  { key: "curp", title: "CURP", text: "Opcional. Ayuda a validar tu identidad más rápido.", icon: FileText },
];

const REASON_DOCS: Record<string, DocKey[]> = {
  INE_ILEGIBLE: ["ineFront", "ineBack"],
  INE_INCOMPLETA: ["ineFront", "ineBack"],
  INE_VENCIDA: ["ineFront", "ineBack"],
  RFC_INVALIDO: ["rfc"],
  DATOS_NO_COINCIDEN: ["ineFront", "addressProof"],
};

export default function Identity() {
  const { userId } = useAuth();
  const j = useJourney();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const [busy, setBusy] = useState<DocKey | null>(null);
  const [rfc, setRfc] = useState<string | null>(null);
  const [curp, setCurp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (j.isLoading || !j.profile) {
    return (
      <div className="space-y-4">
        <Skel className="h-10 w-56" />
        <Skel className="h-24 rounded-2xl" />
        <Skel className="h-80 rounded-2xl" />
      </div>
    );
  }
  const p = j.profile;
  const copy = KYC_COPY[j.kyc];
  const flagged = j.kyc === "rechazado" ? REASON_DOCS[p.kyc.reasonCode ?? ""] ?? [] : [];
  const locked = j.kyc === "verificado";
  const rfcVal = rfc ?? p.rfc;
  const curpVal = curp ?? p.curp;

  const onFile = async (key: DocKey, file?: File | null) => {
    if (!file || !userId) return;
    setBusy(key);
    try {
      const status = await uploadDocument(userId, key, file);
      await refresh(CK.profile);
      if (status === "por_verificar" && j.kyc !== "por_verificar") toast.success("¡Listo! Enviamos tus documentos a revisión.");
      else toast.success("Documento cargado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveData = async () => {
    if (!userId) return;
    if (rfcVal && !isValidRfc(rfcVal)) return toast.error("Revisa tu RFC: 12 o 13 caracteres.");
    if (curpVal && curpVal.length !== 18) return toast.error("La CURP tiene 18 caracteres.");
    setSaving(true);
    try {
      await updateProfile(userId, { rfc: rfcVal, curp: curpVal });
      await refresh(CK.profile);
      setRfc(null);
      setCurp(null);
      toast.success("Datos guardados.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tu identidad" subtitle="La necesitamos para activar tu membresía y proteger tu cuenta." back="/dashboard" action={<Pill tone={copy.tone}>{copy.label}</Pill>} />

      <div className="space-y-5">
        {j.kyc === "rechazado" && (
          <Notice tone="danger" title="Necesitamos que corrijas tus documentos">
            <p>{p.kyc.reasonMessage || "Uno o más documentos no se pudieron validar. Vuelve a subirlos."}</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[13px]">
              <li>Toma la foto con buena luz y sin flash, para evitar brillos.</li>
              <li>Que se vean las 4 esquinas y el texto se lea sin que esté borroso.</li>
              <li>Sube documentos vigentes y con menos de 3 meses (domicilio y constancia fiscal).</li>
            </ul>
          </Notice>
        )}
        {j.kyc === "por_verificar" && (
          <Notice tone="info" title="Tus documentos están en revisión">
            Normalmente tarda menos de 24 horas hábiles. Te avisaremos por correo. Mientras tanto ya puedes activar tu membresía.
          </Notice>
        )}
        {j.kyc === "verificado" && (
          <Notice tone="success" title="Identidad verificada">
            Todo en orden. Si cambias de domicilio o tu INE vence, escríbenos para actualizarla.
          </Notice>
        )}

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 md:px-5">
            <p className="text-[15px] font-bold text-slate-900">Documentos</p>
            <span className="text-xs font-bold text-slate-400">
              {j.docsCount} de {j.docsTotal} obligatorios
            </span>
          </div>
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-brand transition-all" style={{ width: `${(j.docsCount / j.docsTotal) * 100}%` }} />
          </div>
          <ul className="divide-y divide-slate-100">
            {DOCS.map((d) => (
              <DocRow
                key={d.key}
                doc={d}
                url={p.docs[d.key]}
                required={REQUIRED_DOCS.includes(d.key)}
                flagged={flagged.includes(d.key)}
                busy={busy === d.key}
                locked={locked}
                onFile={(f) => onFile(d.key, f)}
              />
            ))}
          </ul>
        </Card>

        <Card className="p-4 md:p-5">
          <p className="mb-4 text-[15px] font-bold text-slate-900">Datos fiscales</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="RFC" hint="Con homoclave, 13 caracteres para persona física.">
              <TextInput value={rfcVal} disabled={locked} onChange={(e) => setRfc(e.target.value.toUpperCase().slice(0, 13))} placeholder="LOHM900215AB3" />
            </Field>
            <Field label="CURP" optional>
              <TextInput value={curpVal} disabled={locked} onChange={(e) => setCurp(e.target.value.toUpperCase().slice(0, 18))} placeholder="LOHM900215MDFPRR09" />
            </Field>
          </div>
          {!locked && (rfc !== null || curp !== null) && (
            <div className="mt-4 flex justify-end">
              <Btn onClick={saveData} loading={saving}>
                Guardar datos
              </Btn>
            </div>
          )}
        </Card>

        <div className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 text-[13px] text-slate-500">
          <Lock size={16} className="mt-0.5 shrink-0 text-slate-400" />
          Tus documentos se guardan cifrados y solo los revisa el equipo de verificación de Increscendo. No los compartimos con terceros sin tu consentimiento.
        </div>

        {(j.docsUploaded || j.kyc === "por_verificar") && !j.hasMembership && (
          <Btn size="lg" block onClick={() => navigate("/memberships")}>
            Continuar con mi membresía <ArrowRight size={18} />
          </Btn>
        )}
      </div>
    </div>
  );
}

export function DocRow({
  doc,
  url,
  required,
  flagged,
  busy,
  locked,
  onFile,
}: {
  doc: (typeof DOCS)[number];
  url: string | null;
  required: boolean;
  flagged: boolean;
  busy: boolean;
  locked: boolean;
  onFile: (f?: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isImg = url && !/\.pdf($|\?)/i.test(url);
  return (
    <li className={cn("flex items-center gap-3 px-4 py-4 md:px-5", flagged && "bg-red-50/60")}>
      <div
        className={cn(
          "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl",
          url ? "bg-slate-100" : "border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400",
        )}
      >
        {url && isImg ? <img src={url} alt="" className="h-full w-full object-cover" /> : <doc.icon size={22} className={url ? "text-slate-500" : ""} />}
        {url && !flagged && (
          <span className="absolute bottom-0.5 right-0.5 rounded-full bg-white">
            <CheckCircle2 size={16} className="text-emerald-500" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[14.5px] font-bold text-slate-900">{doc.title}</p>
          {!required && <span className="text-xs text-slate-400">(opcional)</span>}
        </div>
        <p className={cn("text-[12.5px]", flagged ? "font-semibold text-red-600" : "text-slate-500")}>{flagged ? "Vuelve a subir este documento." : doc.text}</p>
      </div>
      {!locked && (
        <>
          <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Btn
            size="sm"
            variant={url && !flagged ? "outline" : "primary"}
            onClick={() => ref.current?.click()}
            disabled={busy}
            icon={busy ? <Loader2 size={15} className="animate-spin" /> : url ? <RefreshCw size={15} /> : <><Camera size={15} className="md:hidden" /><Upload size={15} className="hidden md:block" /></>}
          >
            {busy ? "Subiendo" : url ? "Cambiar" : "Subir"}
          </Btn>
        </>
      )}
    </li>
  );
}
