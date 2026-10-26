/**
 * Alta de tarjeta con Conekta.js: el número nunca toca nuestro servidor, se
 * tokeniza en el navegador y solo se envía el token a /add-card.
 */
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Field, TextInput } from "./ui";
import { addCard } from "../lib/api";
import { IS_DEMO } from "../lib/env";
import { onlyDigits } from "../lib/format";

type ConektaTokenResponse = { id: string };
type ConektaError = { message_to_purchaser?: string; message?: string };
type ConektaSDK = {
  setPublicKey: (k: string) => void;
  setLanguage: (l: string) => void;
  Token: { create: (p: unknown, ok: (t: ConektaTokenResponse) => void, err: (e: ConektaError) => void) => void };
};
const getConekta = () => (window as unknown as { Conekta?: ConektaSDK }).Conekta;

const SCRIPT_ID = "conekta-js-sdk";
const SCRIPT_URL = "https://cdn.conekta.io/js/latest/conekta.js";
const PUBLIC_KEY = (import.meta.env.VITE_CONEKTA_PUBLIC_KEY ?? "").trim();

function useConekta() {
  const [ready, setReady] = useState(!!getConekta());
  useEffect(() => {
    if (IS_DEMO || !PUBLIC_KEY) return;
    const init = () => {
      const c = getConekta();
      if (c) {
        c.setPublicKey(PUBLIC_KEY);
        c.setLanguage("es");
        setReady(true);
      }
    };
    if (getConekta()) return init();
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_URL;
      s.async = true;
      document.body.appendChild(s);
    }
    s.addEventListener("load", init);
    return () => s?.removeEventListener("load", init);
  }, []);
  return ready || IS_DEMO;
}

export function detectBrand(n: string) {
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "";
}

function luhn(n: string) {
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return n.length >= 13 && sum % 10 === 0;
}

export function CardForm({ onDone, submitLabel = "Guardar tarjeta" }: { onDone: () => void; submitLabel?: string }) {
  const { userId } = useAuth();
  const ready = useConekta();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const digits = onlyDigits(number);
  const brand = detectBrand(digits);
  const [mm, yy] = exp.split("/");
  const expOk = (() => {
    const m = Number(mm);
    const y = Number(yy);
    if (!m || m > 12 || !yy || yy.length !== 2) return false;
    const end = new Date(2000 + y, m, 1);
    return end > new Date();
  })();
  const errs = {
    number: luhn(digits) ? null : "Revisa el número de tarjeta.",
    name: name.trim().length > 3 ? null : "Escribe el nombre como aparece en la tarjeta.",
    exp: expOk ? null : "Fecha inválida o vencida.",
    cvc: /^\d{3,4}$/.test(cvc) ? null : "3 o 4 dígitos.",
  };
  const valid = Object.values(errs).every((e) => !e);

  const submit = async () => {
    setTried(true);
    if (!valid || !userId) return;
    if (!ready) return toast.error("El servicio de pagos no está disponible. Intenta en un momento.");
    setSaving(true);
    try {
      let tokenId = "tok_demo";
      if (!IS_DEMO) {
        const c = getConekta();
        if (!c) throw new Error("El servicio de pagos no está disponible.");
        tokenId = await new Promise<string>((resolve, reject) =>
          c.Token.create(
            { card: { number: digits, name: name.trim(), exp_month: mm, exp_year: yy, cvc } },
            (t) => resolve(t.id),
            (e) => reject(new Error(e.message_to_purchaser || e.message || "No pudimos validar tu tarjeta.")),
          ),
        );
      }
      await addCard(userId, tokenId, { last4: digits.slice(-4), brand, holder: name.trim(), expiry: exp });
      toast.success("Tarjeta guardada.");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Número de tarjeta" error={tried ? errs.number : null}>
        <TextInput
          icon={<CreditCard />}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={number}
          onChange={(e) => setNumber(onlyDigits(e.target.value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
          invalid={tried && !!errs.number}
          right={brand ? <span className="pr-2 text-xs font-extrabold uppercase text-slate-500">{brand}</span> : undefined}
        />
      </Field>
      <Field label="Nombre en la tarjeta" error={tried ? errs.name : null}>
        <TextInput icon={<User />} autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} invalid={tried && !!errs.name} placeholder="MARIANA LÓPEZ" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vencimiento" error={tried ? errs.exp : null}>
          <TextInput
            icon={<CalendarDays />}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={exp}
            onChange={(e) => {
              const d = onlyDigits(e.target.value).slice(0, 4);
              setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
            }}
            invalid={tried && !!errs.exp}
          />
        </Field>
        <Field label="CVV" error={tried ? errs.cvc : null}>
          <TextInput icon={<Lock />} inputMode="numeric" autoComplete="cc-csc" type="password" placeholder="•••" value={cvc} onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))} invalid={tried && !!errs.cvc} />
        </Field>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Lock size={12} /> Pago seguro procesado por Conekta. No guardamos los datos completos de tu tarjeta.
      </p>
      <Btn block size="lg" onClick={submit} loading={saving}>
        {submitLabel}
      </Btn>
    </div>
  );
}
