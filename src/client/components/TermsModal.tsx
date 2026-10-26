/**
 * Términos y condiciones obligatorios.
 * - En el registro es el último paso.
 * - TermsGate lo muestra (sin poder cerrarlo) a clientes que entraron antes y
 *   aún no tienen registrada la aceptación.
 */
import React, { useState } from "react";
import { toast } from "sonner";
import { FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, CheckRow, Sheet } from "./ui";
import { acceptTerms } from "../lib/api";
import { useProfile, useRefresh, CK } from "../hooks";

export const TERMS_POINTS = [
  "Increscendo Fintech te ofrece una membresía con beneficios, pago de servicios y, cuando esté disponible, una tarjeta.",
  "Tu información personal y tus documentos se usan solo para verificar tu identidad y prestar los servicios contratados.",
  "La membresía es anual y se puede cancelar según los términos de cancelación vigentes.",
  "Los cobros con tarjeta se procesan con Conekta; Increscendo no guarda los datos completos de tu tarjeta.",
];

export function TermsContent({
  terms,
  privacy,
  onTerms,
  onPrivacy,
  invalid,
}: {
  terms: boolean;
  privacy: boolean;
  onTerms: (v: boolean) => void;
  onPrivacy: (v: boolean) => void;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <FileText size={16} className="text-brand" /> Lo más importante
        </p>
        <ul className="space-y-2 text-[13.5px] leading-relaxed text-slate-600">
          {TERMS_POINTS.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <CheckRow checked={terms} onChange={onTerms} invalid={invalid && !terms}>
        Leí y acepto los{" "}
        <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer" className="font-semibold text-brand underline-offset-2 hover:underline">
          Términos y condiciones
        </a>{" "}
        y los{" "}
        <a href="/terminos-cancelacion" target="_blank" rel="noreferrer" className="font-semibold text-brand underline-offset-2 hover:underline">
          términos de cancelación
        </a>
        .
      </CheckRow>
      <CheckRow checked={privacy} onChange={onPrivacy} invalid={invalid && !privacy}>
        Acepto el{" "}
        <a href="/politicas-privacidad" target="_blank" rel="noreferrer" className="font-semibold text-brand underline-offset-2 hover:underline">
          Aviso de privacidad
        </a>{" "}
        y el uso de mis datos para verificar mi identidad.
      </CheckRow>
    </div>
  );
}

export function TermsGate() {
  const { userId } = useAuth();
  const { data: profile } = useProfile();
  const refresh = useRefresh();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const open = !!profile && !profile.termsAcceptedAt;
  if (!open) return null;

  return (
    <Sheet
      open
      locked
      onOpenChange={() => undefined}
      title="Antes de continuar"
      description="Actualizamos nuestros términos. Necesitamos tu aceptación para seguir usando tu cuenta."
      footer={
        <Btn
          block
          size="lg"
          disabled={!terms || !privacy}
          loading={saving}
          icon={<ShieldCheck size={18} />}
          onClick={async () => {
            if (!userId) return;
            setSaving(true);
            try {
              await acceptTerms(userId);
              await refresh(CK.profile);
              toast.success("¡Listo! Gracias por aceptar.");
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          Aceptar y continuar
        </Btn>
      }
    >
      <TermsContent terms={terms} privacy={privacy} onTerms={setTerms} onPrivacy={setPrivacy} />
    </Sheet>
  );
}
