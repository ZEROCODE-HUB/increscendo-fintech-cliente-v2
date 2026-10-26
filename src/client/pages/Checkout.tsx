/**
 * Compra de membresía: Plan → Identidad (solo si faltan documentos) →
 * Contrato → Pago → Listo.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileSignature,
  Link2,
  Plus,
  Store,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Card, CheckRow, Field, KV, Notice, PageHeader, Skel, Stepper, TextInput } from "../components/ui";
import { CardForm } from "../components/CardForm";
import { DOCS, DocRow } from "./Identity";
import { CK, useJourney, usePaymentMethods, usePlans, useRefresh } from "../hooks";
import {
  acquireMembership,
  ApiError,
  REQUIRED_DOCS,
  requestMembershipContract,
  setDefaultCard,
  uploadDocument,
  validateCoupon,
  type AcquireResult,
  type CheckoutMethod,
  type Coupon,
} from "../lib/api";
import { isValidRfc, money, shortDate } from "../lib/format";
import type { DocKey } from "../lib/types";

const METHODS: { v: CheckoutMethod; label: string; icon: React.ElementType; help: string }[] = [
  { v: "card", label: "Tarjeta", icon: CreditCard, help: "Activación inmediata." },
  { v: "link", label: "Link de pago", icon: Link2, help: "Paga desde la página segura de Conekta." },
  { v: "spei", label: "Transferencia SPEI", icon: Building2, help: "Se activa al recibir tu transferencia." },
  { v: "cash", label: "Efectivo", icon: Store, help: "Paga en OXXO y tiendas participantes." },
];

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const j = useJourney();
  const refresh = useRefresh();
  const { data: plans, isLoading } = usePlans();
  const { data: methods } = usePaymentMethods();
  const plan = useMemo(() => (plans ?? []).find((p) => p.id === params.get("plan")) ?? (plans ?? []).find((p) => p.highlighted) ?? plans?.[0], [plans, params]);

  // Si faltan documentos al entrar, el paso de identidad se mantiene visible aunque se completen.
  const [needsDocs, setNeedsDocs] = useState<boolean | null>(null);
  useEffect(() => {
    if (needsDocs === null && !j.isLoading && j.profile) setNeedsDocs(!j.canBuyMembership);
  }, [j.isLoading, j.profile, j.canBuyMembership, needsDocs]);

  const steps = ["Resumen", ...(needsDocs ? ["Identidad"] : []), "Contrato", "Pago"];
  const [step, setStep] = useState(0);
  const name = steps[step];

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [rfc, setRfc] = useState("");
  const [fiscal, setFiscal] = useState("");
  const [contractOk, setContractOk] = useState(false);
  const [method, setMethod] = useState<CheckoutMethod>("card");
  const [cardId, setCardId] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<AcquireResult | null>(null);
  const [busyDoc, setBusyDoc] = useState<DocKey | null>(null);

  useEffect(() => {
    if (j.profile && !rfc) {
      setRfc(j.profile.rfc);
      setFiscal(j.profile.address);
    }
  }, [j.profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = (methods ?? []).filter((m) => m.type === "card");
  useEffect(() => {
    if (!cardId && cards.length) setCardId((cards.find((c) => c.isDefault) ?? cards[0]).id);
    if (!cards.length) setAddingCard(true);
    else setAddingCard(false);
  }, [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || j.isLoading || needsDocs === null || !plan) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skel className="h-10 w-60" />
        <Skel className="h-72 rounded-2xl" />
      </div>
    );
  }

  const total = Math.max(0, plan.price - (coupon?.discount ?? 0));

  if (result) return <Done result={result} planName={plan.name} total={total} />;

  const next = async () => {
    if (name === "Resumen" && wantInvoice && (!isValidRfc(rfc) || fiscal.trim().length < 10)) {
      return toast.error("Completa tu RFC y domicilio fiscal para la factura.");
    }
    if (name === "Identidad" && !REQUIRED_DOCS.every((k) => !!j.profile?.docs[k])) {
      return toast.error("Sube los documentos marcados para continuar.");
    }
    if (name === "Contrato") {
      if (!contractOk) return toast.error("Acepta el contrato para continuar.");
      if (userId && j.profile) void requestMembershipContract(userId, j.profile.email, plan.id);
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pay = async () => {
    if (!userId) return;
    if (method === "card" && !cards.length) return toast.error("Agrega una tarjeta para continuar.");
    setPaying(true);
    try {
      const chosen = cards.find((c) => c.id === cardId);
      if (method === "card" && chosen && !chosen.isDefault) await setDefaultCard(userId, chosen);
      const r = await acquireMembership({
        userId,
        plan,
        coupon,
        method,
        invoice: wantInvoice ? { rfc, fiscalAddress: fiscal } : null,
        email: j.profile?.email,
        name: j.profile ? `${j.profile.firstName} ${j.profile.lastName}` : undefined,
      });
      await refresh(CK.membership, CK.movements);
      setResult(r);
      window.scrollTo({ top: 0 });
    } catch (e) {
      const er = e as ApiError;
      if (er.code === "no_payment_method") setAddingCard(true);
      toast.error(er.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Membresía ${plan.name}`} subtitle={`${money(plan.price, 0)} ${plan.currency} · ${plan.period}`} back="/memberships" />
      <Stepper steps={steps} current={step} />

      {name === "Resumen" && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-bold text-slate-900">Incluye</p>
            <ul className="mt-3 space-y-2">
              {plan.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand" /> {b}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <p className="mb-3 text-sm font-bold text-slate-900">¿Tienes un cupón?</p>
            {coupon ? (
              <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
                <Tag size={18} className="text-brand" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-dark">{coupon.code}</p>
                  <p className="text-xs text-brand-dark/80">{coupon.label} · −{money(coupon.discount)}</p>
                </div>
                <button type="button" onClick={() => setCoupon(null)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-dark hover:bg-white/60" aria-label="Quitar cupón">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <TextInput icon={<Tag />} placeholder="CÓDIGO" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                </div>
                <Btn
                  variant="navy"
                  className="h-12"
                  loading={checkingCoupon}
                  disabled={!couponCode.trim()}
                  onClick={async () => {
                    setCheckingCoupon(true);
                    try {
                      setCoupon(await validateCoupon(couponCode, plan.price));
                      toast.success("Cupón aplicado.");
                    } catch (e) {
                      toast.error((e as Error).message);
                    } finally {
                      setCheckingCoupon(false);
                    }
                  }}
                >
                  Aplicar
                </Btn>
              </div>
            )}
          </Card>
          <Card className="space-y-4 p-5">
            <CheckRow checked={wantInvoice} onChange={setWantInvoice}>
              Quiero factura
            </CheckRow>
            {wantInvoice && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="RFC" error={rfc && !isValidRfc(rfc) ? "RFC inválido." : null}>
                  <TextInput value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase().slice(0, 13))} />
                </Field>
                <Field label="Domicilio fiscal">
                  <TextInput value={fiscal} onChange={(e) => setFiscal(e.target.value)} />
                </Field>
              </div>
            )}
          </Card>
          <Totals price={plan.price} coupon={coupon} total={total} />
        </div>
      )}

      {name === "Identidad" && (
        <div className="space-y-4">
          <Notice tone="info">Sube estos documentos para activar tu membresía. No tienes que esperar a que los aprobemos.</Notice>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {DOCS.filter((d) => REQUIRED_DOCS.includes(d.key)).map((d) => (
              <DocRow
                key={d.key}
                doc={d}
                url={j.profile?.docs[d.key] ?? null}
                required
                flagged={false}
                busy={busyDoc === d.key}
                locked={false}
                onFile={async (f) => {
                  if (!f || !userId) return;
                  setBusyDoc(d.key);
                  try {
                    await uploadDocument(userId, d.key, f);
                    await refresh(CK.profile);
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setBusyDoc(null);
                  }
                }}
              />
            ))}
          </Card>
        </div>
      )}

      {name === "Contrato" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <FileSignature size={20} />
              </span>
              <div>
                <p className="font-bold text-slate-900">Contrato de membresía</p>
                <p className="text-[13px] text-slate-500">Membresía {plan.name} · vigencia {plan.period.toLowerCase()}</p>
              </div>
            </div>
            <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-600">
              <p>
                <b>Partes.</b> Increscendo Fintech y {j.profile?.firstName} {j.profile?.lastName} ("el Miembro").
              </p>
              <p>
                <b>Objeto.</b> Acceso a los beneficios del plan {plan.name} durante {plan.durationDays} días a partir del pago.
              </p>
              <p>
                <b>Precio.</b> {money(total)} {plan.currency}, en una sola exhibición.
              </p>
              <p>
                <b>Cancelación.</b> Conforme a los términos de cancelación publicados en el sitio.
              </p>
              <p>
                <b>Datos personales.</b> Tratados según el Aviso de privacidad.
              </p>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Además te enviaremos el contrato a <b>{j.profile?.email}</b> para que lo firmes electrónicamente.
            </p>
          </Card>
          <CheckRow checked={contractOk} onChange={setContractOk}>
            Leí y acepto el contrato de membresía y los{" "}
            <a className="font-semibold text-brand hover:underline" href="/terminos-cancelacion" target="_blank" rel="noreferrer">
              términos de cancelación
            </a>
            .
          </CheckRow>
        </div>
      )}

      {name === "Pago" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {METHODS.map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setMethod(m.v)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all",
                  method === m.v ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20" : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <m.icon size={20} className={method === m.v ? "text-brand" : "text-slate-500"} />
                <span className="text-sm font-bold text-slate-900">{m.label}</span>
              </button>
            ))}
          </div>
          <p className="px-1 text-[13px] text-slate-500">{METHODS.find((m) => m.v === method)?.help}</p>

          {method === "card" && (
            <Card className="p-4">
              {cards.length > 0 && !addingCard && (
                <div className="space-y-2">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardId(c.id)}
                      className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left", cardId === c.id ? "border-brand bg-brand-soft/50" : "border-slate-200")}
                    >
                      <span className="grid h-9 w-12 place-items-center rounded-md bg-brand-navy text-[10px] font-extrabold uppercase text-white">{c.brand || "card"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">•••• {c.last4}</p>
                        <p className="text-xs text-slate-500">
                          {c.holderName} · {c.expiry}
                        </p>
                      </div>
                      {c.isDefault && <span className="text-xs font-bold text-brand">Principal</span>}
                    </button>
                  ))}
                  <button type="button" onClick={() => setAddingCard(true)} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-bold text-brand hover:bg-brand-soft/50">
                    <Plus size={16} /> Usar otra tarjeta
                  </button>
                </div>
              )}
              {addingCard && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Nueva tarjeta</p>
                    {cards.length > 0 && (
                      <button type="button" className="text-sm font-semibold text-slate-500" onClick={() => setAddingCard(false)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                  <CardForm
                    submitLabel="Guardar y continuar"
                    onDone={async () => {
                      await refresh(CK.methods);
                      setAddingCard(false);
                    }}
                  />
                </>
              )}
            </Card>
          )}

          <Totals price={plan.price} coupon={coupon} total={total} />
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200/70 bg-[#f3f5f8]/95 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {step > 0 && (
          <Btn variant="outline" size="lg" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={18} />} className="px-4" aria-label="Atrás" />
        )}
        {name !== "Pago" ? (
          <Btn size="lg" block onClick={next}>
            Continuar <ArrowRight size={18} />
          </Btn>
        ) : (
          <Btn size="lg" block loading={paying} disabled={method === "card" && (addingCard || !cards.length)} onClick={pay}>
            {method === "card" ? `Pagar ${money(total)}` : "Generar referencia"}
          </Btn>
        )}
      </div>
      {name === "Pago" && <p className="mt-3 text-center text-xs text-slate-400">Al pagar confirmas la compra de la membresía {plan.name}.</p>}
      <button type="button" className="sr-only" onClick={() => navigate("/memberships")}>
        Cancelar
      </button>
    </div>
  );
}

function Totals({ price, coupon, total }: { price: number; coupon: Coupon | null; total: number }) {
  return (
    <Card className="px-5 py-3">
      <KV k="Membresía" v={money(price)} />
      {coupon && <KV k={`Cupón ${coupon.code}`} v={<span className="text-brand">−{money(coupon.discount)}</span>} />}
      <div className="my-1 h-px bg-slate-100" />
      <KV k="Total" v={money(total)} strong />
    </Card>
  );
}

function Done({ result, planName, total }: { result: AcquireResult; planName: string; total: number }) {
  const navigate = useNavigate();
  const copy = (t: string) => {
    void navigator.clipboard?.writeText(t);
    toast.success("Copiado.");
  };
  if (result.kind === "paid") {
    return (
      <div className="mx-auto max-w-md pt-6 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={42} />
        </span>
        <h1 className="mt-5 text-[26px] font-extrabold tracking-tight text-slate-900">¡Tu membresía {planName} está activa!</h1>
        <p className="mt-2 text-slate-500">
          Pagaste {money(total)}. Vence el {shortDate(result.membership?.expiresAt)}. Te enviamos el comprobante por correo.
        </p>
        <div className="mt-8 space-y-3">
          <Btn size="lg" block onClick={() => navigate("/dashboard")}>
            Ir a inicio
          </Btn>
          <Btn size="lg" block variant="outline" onClick={() => navigate("/servicios")}>
            Pagar un servicio
          </Btn>
        </div>
      </div>
    );
  }
  const label = result.method === "spei" ? "Transferencia SPEI" : result.method === "cash" ? "Pago en efectivo" : "Link de pago";
  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <Banknote size={30} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Completa tu pago</h1>
        <p className="mt-1 text-sm text-slate-500">
          {label} · {money(total)} · vence {shortDate(result.expiresAt)}
        </p>
      </div>
      <Card className="mt-6 divide-y divide-slate-100">
        {result.clabe && <CopyRow label="CLABE" value={result.clabe} onCopy={copy} />}
        <CopyRow label={result.method === "cash" ? "Referencia" : "Concepto / referencia"} value={result.reference} onCopy={copy} />
        <div className="px-4 py-3">
          <KV k="Monto exacto" v={money(total)} strong />
        </div>
      </Card>
      {result.url && (
        <Btn size="lg" block className="mt-4" onClick={() => window.open(result.url, "_blank", "noopener")}>
          Abrir link de pago <ExternalLink size={16} />
        </Btn>
      )}
      <Notice tone="info">Tu membresía se activa automáticamente cuando recibamos el pago. Te avisaremos por correo.</Notice>
      <Btn size="lg" block variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
        Ir a inicio
      </Btn>
    </div>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate font-mono text-[15px] font-bold tracking-wide text-slate-900">{value}</p>
      </div>
      <button type="button" onClick={() => onCopy(value)} className="grid h-9 w-9 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label={`Copiar ${label}`}>
        <Copy size={16} />
      </button>
    </div>
  );
}
