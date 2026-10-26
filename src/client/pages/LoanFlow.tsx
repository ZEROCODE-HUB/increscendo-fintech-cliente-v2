/**
 * Solicitud de préstamo, con el mismo patrón que "Mi tarjeta" (sin popup):
 * Bienvenida → Requisitos → Monto y plazo → Cuenta → Revisión → Enviada.
 * Después, Aprobación → Contrato → Desembolso se siguen en el detalle.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CalendarClock, CheckCircle2, Clock3, Crown, FileSignature, HandCoins, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, CheckRow, KV, Notice, PageHeader, Skel, Stepper } from "../components/ui";
import { BankForm } from "../components/BankForm";
import { CK, useJourney, useLoans, usePaymentMethods, useRefresh } from "../hooks";
import { createLoanRequest, type LoanRequestInput } from "../lib/api";
import { maskClabe, money, monthlyPayment } from "../lib/format";
import { isOpenLoan } from "../lib/rules";
import type { Loan } from "../lib/types";

export const LOAN_LIMITS = { min: 5000, max: 50000, step: 1000, terms: [3, 6, 9, 12, 18, 24], defaultRate: 42 };
const STEPS = ["Bienvenida", "Requisitos", "Monto y plazo", "Cuenta", "Revisión"];

export default function LoanFlow() {
  const j = useJourney();
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: methods } = usePaymentMethods();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(() => {
    const v = Number(params.get("monto"));
    return v >= LOAN_LIMITS.min && v <= LOAN_LIMITS.max ? v : 15000;
  });
  const [term, setTerm] = useState(() => {
    const v = Number(params.get("plazo"));
    return LOAN_LIMITS.terms.includes(v) ? v : 12;
  });
  const [accountId, setAccountId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [consent, setConsent] = useState(false);
  const [truth, setTruth] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Loan | null>(null);

  const banks = (methods ?? []).filter((m) => m.type === "bank");
  useEffect(() => {
    if (!accountId && banks.length) setAccountId(banks[0].id);
  }, [banks.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const account = banks.find((b) => b.id === accountId) ?? null;

  const rate = j.membership?.interestRate || LOAN_LIMITS.defaultRate;
  const cuota = useMemo(() => monthlyPayment(amount, term, rate), [amount, term, rate]);
  const total = cuota * term;

  if (j.isLoading || loansLoading) return <Skel className="mx-auto h-96 max-w-2xl rounded-2xl" />;
  if (!j.loanInvited) return <Navigate to="/prestamos" replace />;
  const open = (loans ?? []).find((l) => isOpenLoan(l.status));
  if (open && !sent) return <Navigate to={`/my-loans/${open.id}`} replace />;

  if (sent) {
    return (
      <div className="mx-auto max-w-md pt-6 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sky-100 text-sky-600">
          <Clock3 size={40} />
        </span>
        <h1 className="mt-5 text-[26px] font-extrabold tracking-tight text-slate-900">Recibimos tu solicitud</h1>
        <p className="mt-2 text-slate-500">
          Folio <b className="text-slate-800">{sent.number}</b>. La revisamos en menos de 24 h hábiles y te avisaremos por correo para firmar tu contrato.
        </p>
        <Btn size="lg" block className="mt-8" onClick={() => navigate(`/my-loans/${sent.id}`)}>
          Ver mi solicitud
        </Btn>
        <Btn size="lg" block variant="ghost" className="mt-2" onClick={() => navigate("/dashboard")}>
          Ir a inicio
        </Btn>
      </div>
    );
  }

  const next = async () => {
    if (step === 1 && !j.canRequestLoan) return;
    if (step === 3) {
      if (!account) return toast.error("Elige o agrega la cuenta donde recibirás el dinero.");
      if (!consent) return toast.error("Autoriza la domiciliación para continuar.");
    }
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!truth || !j.profile || !account) return toast.error("Confirma que tu información es correcta.");
    setSending(true);
    try {
      const input: LoanRequestInput = {
        amount,
        installments: term,
        interestRate: rate,
        monthlyPayment: cuota,
        totalToPay: total,
        account: { paymentMethodId: account.id, bank: account.bankName ?? "", clabe: account.clabe ?? "", holder: account.holderName },
      };
      const loan = await createLoanRequest(j.profile, input);
      setSent(loan);
      void refresh(CK.loans);
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Solicitar préstamo" subtitle="Respuesta en menos de 24 h hábiles." back="/prestamos" />
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <Card className="overflow-hidden">
          <div className="relative bg-[linear-gradient(150deg,#0d1a2e_0%,#13213a_60%,#123a40_100%)] p-6 text-white md:p-8">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full border border-white/[.07]" />
            <HandCoins className="relative text-[#5fd3bb]" size={28} />
            <h2 className="relative mt-3 text-[24px] font-extrabold leading-tight tracking-tight">Un préstamo personal con la tasa de tu membresía</h2>
            <p className="relative mt-2 max-w-md text-sm text-white/70">
              Desde {money(LOAN_LIMITS.min, 0)} hasta {money(LOAN_LIMITS.max, 0)}, de {LOAN_LIMITS.terms[0]} a {LOAN_LIMITS.terms[LOAN_LIMITS.terms.length - 1]} meses. Las cuotas se cobran
              automáticamente cada mes.
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-6">
            {[
              { icon: Clock3, t: "Respuesta en 24 h", d: "Revisamos tu solicitud en días hábiles." },
              { icon: FileSignature, t: "Firma en línea", d: "Recibes el contrato por correo." },
              { icon: CalendarClock, t: "Pagos automáticos", d: "Puedes adelantar cuotas cuando quieras." },
            ].map((x) => (
              <div key={x.t} className="flex gap-3">
                <x.icon size={20} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{x.t}</p>
                  <p className="text-[13px] text-slate-500">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
          {j.loanPreapproved && (
            <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm font-semibold text-brand-dark md:mx-6">
              <BadgeCheck size={17} /> Tienes un préstamo preaprobado
            </div>
          )}
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-slate-600">Para solicitar tu préstamo necesitas:</p>
          <Req ok={j.verified} icon={ShieldCheck} title="Identidad verificada" text={j.kyc === "por_verificar" ? "Tus documentos están en revisión." : "Sube y valida tus documentos."} to="/identidad" />
          <Req ok={j.hasMembership} icon={Crown} title="Membresía activa" text="Elige tu plan para continuar." to="/memberships" />
          {!j.canRequestLoan && <Notice tone="warning">Completa los requisitos para continuar con tu solicitud.</Notice>}
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-5 md:p-6">
            <p className="text-sm font-semibold text-slate-500">¿Cuánto necesitas?</p>
            <p className="mt-1 text-[40px] font-extrabold tracking-tight text-slate-900 tabular-nums">{money(amount, 0)}</p>
            <input
              type="range"
              min={LOAN_LIMITS.min}
              max={LOAN_LIMITS.max}
              step={LOAN_LIMITS.step}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-3 w-full accent-[#1d7c69]"
              aria-label="Monto"
            />
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>{money(LOAN_LIMITS.min, 0)}</span>
              <span>{money(LOAN_LIMITS.max, 0)}</span>
            </div>
            <p className="mb-2 mt-6 text-sm font-semibold text-slate-500">Plazo</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {LOAN_LIMITS.terms.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerm(t)}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-bold transition-all",
                    term === t ? "border-brand bg-brand text-white shadow" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  )}
                >
                  {t} meses
                </button>
              ))}
            </div>
          </Card>
          <Card className="grid grid-cols-3 divide-x divide-slate-100 p-1">
            {[
              { k: "Pago mensual", v: money(cuota) },
              { k: "Total a pagar", v: money(total) },
              { k: "Tasa anual", v: `${rate}%` },
            ].map((x) => (
              <div key={x.k} className="px-3 py-3 text-center">
                <p className="text-[11.5px] font-semibold text-slate-500">{x.k}</p>
                <p className="mt-0.5 text-[15px] font-extrabold text-slate-900 tabular-nums">{x.v}</p>
              </div>
            ))}
          </Card>
          <p className="px-1 text-xs text-slate-400">Cálculo estimado con la tasa de tu membresía {j.membership?.planName}. El monto final se confirma al aprobar.</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="px-1 text-sm text-slate-600">Aquí depositaremos tu préstamo y se cobrarán tus cuotas.</p>
          {!adding && (
            <Card className="space-y-2 p-3">
              {banks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setAccountId(b.id)}
                  className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left", accountId === b.id ? "border-brand bg-brand-soft/50" : "border-slate-200")}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-slate-900">{b.bankName}</p>
                    <p className="text-[13px] text-slate-500">
                      CLABE {maskClabe(b.clabe)} · {b.holderName}
                    </p>
                  </div>
                  <span className={cn("h-5 w-5 rounded-full border-2", accountId === b.id ? "border-[6px] border-brand" : "border-slate-300")} />
                </button>
              ))}
              <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-bold text-brand hover:bg-brand-soft/50">
                <Plus size={16} /> Agregar otra cuenta
              </button>
            </Card>
          )}
          {(adding || !banks.length) && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Nueva cuenta</p>
                {banks.length > 0 && (
                  <button type="button" onClick={() => setAdding(false)} className="text-sm font-semibold text-slate-500">
                    Cancelar
                  </button>
                )}
              </div>
              <BankForm
                defaultHolder={j.profile ? `${j.profile.firstName} ${j.profile.lastName}` : ""}
                submitLabel="Usar esta cuenta"
                onDone={async (m) => {
                  await refresh(CK.methods);
                  setAccountId(m.id);
                  setAdding(false);
                }}
              />
            </Card>
          )}
          {account && (
            <>
              {/* El proveedor (Druo para BBVA, Belvo para el resto) lo decide el backend sin mostrarlo al cliente. */}
              <Notice tone="info">Tus cuotas se cobrarán automáticamente cada mes. Si tu banco lo pide, te enviaremos un enlace para autorizarlo.</Notice>
              <CheckRow checked={consent} onChange={setConsent}>
                Autorizo a Increscendo a domiciliar el cobro de mis cuotas mensuales de {money(cuota)} a la cuenta {account.bankName} {maskClabe(account.clabe)}.
              </CheckRow>
            </>
          )}
        </div>
      )}

      {step === 4 && j.profile && account && (
        <div className="space-y-4">
          <Card className="px-5 py-3">
            <KV k="Monto" v={money(amount)} strong />
            <KV k="Plazo" v={`${term} meses`} />
            <KV k="Pago mensual" v={money(cuota)} />
            <KV k="Tasa anual" v={`${rate}%`} />
            <KV k="Total a pagar" v={money(total)} />
            <KV k="Cuenta" v={`${account.bankName} ${maskClabe(account.clabe)}`} />
          </Card>
          <Card className="px-5 py-3">
            <p className="py-2 text-sm font-bold text-slate-900">Tus datos</p>
            <KV k="Nombre" v={`${j.profile.firstName} ${j.profile.lastName}`} />
            <KV k="RFC" v={j.profile.rfc || "—"} />
            <KV k="Celular" v={j.profile.phone || "—"} />
            <KV k="Domicilio" v={<span className="line-clamp-2 max-w-[220px]">{j.profile.address || "—"}</span>} />
            <button type="button" onClick={() => navigate("/mi-cuenta")} className="pb-2 text-sm font-semibold text-brand hover:underline">
              ¿Algo cambió? Actualiza tus datos
            </button>
          </Card>
          <CheckRow checked={truth} onChange={setTruth}>
            Declaro que la información es verdadera y autorizo a Increscendo a revisar mi solicitud.
          </CheckRow>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200/70 bg-[#f3f5f8]/95 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        {step > 0 && <Btn variant="outline" size="lg" className="px-4" icon={<ArrowLeft size={18} />} onClick={() => setStep(step - 1)} aria-label="Atrás" />}
        <Btn size="lg" block loading={sending} onClick={next} disabled={(step === 3 && adding) || (step === 1 && !j.canRequestLoan)}>
          {step < 4 ? (
            <>
              {step === 0 ? "Comenzar" : "Continuar"} <ArrowRight size={18} />
            </>
          ) : (
            "Enviar solicitud"
          )}
        </Btn>
      </div>
    </div>
  );
}

function Req({ ok, icon: Icon, title, text, to }: { ok: boolean; icon: React.ElementType; title: string; text: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" disabled={ok} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3.5 text-left disabled:bg-emerald-50/50">
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", ok ? "bg-emerald-500 text-white" : "bg-brand-soft text-brand")}>
        {ok ? <CheckCircle2 size={20} /> : <Icon size={20} />}
      </span>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-slate-900">{title}</p>
        <p className="text-[13px] text-slate-500">{ok ? "Listo" : text}</p>
      </div>
      {!ok && <ArrowRight size={18} className="text-slate-400" />}
    </button>
  );
}
