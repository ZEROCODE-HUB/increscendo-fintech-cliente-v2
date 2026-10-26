/**
 * Préstamos: misma estructura que "Mi tarjeta". Presentación + simulador +
 * requisitos, y abajo el préstamo en curso y el historial. No es un servicio
 * prioritario: no aparece en la barra inferior móvil.
 */
import React, { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, CheckCircle2, Crown, HandCoins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, PageHeader, Pill, Skel } from "../components/ui";
import { useJourney, useLoans } from "../hooks";
import { money, monthlyPayment, shortDate } from "../lib/format";
import { isOpenLoan, LOAN_COPY } from "../lib/rules";
import type { Loan } from "../lib/types";
import { LOAN_LIMITS } from "./LoanFlow";

export default function Loans() {
  const j = useJourney();
  const { data, isLoading } = useLoans();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(15000);
  const [term, setTerm] = useState(12);
  const rate = j.membership?.interestRate || LOAN_LIMITS.defaultRate;
  const cuota = useMemo(() => monthlyPayment(amount, term, rate), [amount, term, rate]);

  if (j.isLoading || isLoading) return <Skel className="mx-auto h-96 max-w-4xl rounded-2xl" />;
  const loans = data ?? [];
  if (!j.loanInvited && !loans.length) return <Navigate to="/dashboard" replace />;
  const open = loans.find((l) => isOpenLoan(l.status));
  const history = loans.filter((l) => l.id !== open?.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Préstamos" subtitle="Un préstamo personal con la tasa de tu membresía." />

      {open ? (
        <LoanCard loan={open} highlight onClick={() => navigate(`/my-loans/${open.id}`)} />
      ) : (
        j.loanInvited && (
          <div className="grid items-stretch gap-6 rounded-3xl bg-white p-5 md:grid-cols-2 md:p-8">
            <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(150deg,#0a1322_0%,#13213a_60%,#123a40_100%)] p-6 text-white">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-white/10" />
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/[.07]" />
              <p className="relative text-[13px] font-semibold text-white/65">Simula tu préstamo</p>
              <p className="relative mt-1 text-[36px] font-extrabold tracking-tight tabular-nums">{money(amount, 0)}</p>
              <input
                type="range"
                min={LOAN_LIMITS.min}
                max={LOAN_LIMITS.max}
                step={LOAN_LIMITS.step}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="relative mt-2 w-full accent-[#5fd3bb]"
                aria-label="Monto"
              />
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {LOAN_LIMITS.terms.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTerm(t)}
                    className={cn("h-8 rounded-lg px-2.5 text-xs font-bold transition-colors", term === t ? "bg-white text-brand-navy" : "bg-white/10 text-white/80 hover:bg-white/20")}
                  >
                    {t} m
                  </button>
                ))}
              </div>
              <div className="relative mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-xs text-white/60">Pago mensual estimado</p>
                  <p className="text-xl font-extrabold tabular-nums">{money(cuota)}</p>
                </div>
                <p className="text-xs text-white/60">Tasa anual {rate}%</p>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              {j.loanPreapproved ? (
                <Pill tone="brand" className="self-start">
                  <BadgeCheck size={12} /> Preaprobado
                </Pill>
              ) : (
                <Pill className="self-start">
                  <HandCoins size={12} /> Préstamo personal
                </Pill>
              )}
              <h2 className="mt-3 text-[24px] font-extrabold leading-tight tracking-tight text-slate-900">Dinero en tu cuenta, pagos automáticos</h2>
              <p className="mt-2 text-sm text-slate-500">Elige monto y plazo, firma en línea y recibe el depósito en tu cuenta. Puedes adelantar cuotas cuando quieras.</p>
              <ul className="mt-5 space-y-2.5">
                <Req ok={j.verified} label="Identidad verificada" icon={ShieldCheck} />
                <Req ok={j.hasMembership} label="Membresía activa" icon={Crown} />
              </ul>
              {j.canRequestLoan ? (
                <Btn size="lg" className="mt-6 self-start" onClick={() => navigate(`/prestamos/solicitar?monto=${amount}&plazo=${term}`)}>
                  Solicitar préstamo <ArrowRight size={18} />
                </Btn>
              ) : (
                <Btn size="lg" className="mt-6 self-start" onClick={() => navigate(!j.verified ? "/identidad" : "/memberships")}>
                  Completar requisitos <ArrowRight size={18} />
                </Btn>
              )}
              <p className="mt-3 text-xs text-slate-400">Cálculo estimado. El monto final se confirma al aprobar tu solicitud.</p>
            </div>
          </div>
        )
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-bold text-slate-900">Historial</h2>
          <div className="space-y-3">
            {history.map((l) => (
              <LoanCard key={l.id} loan={l} onClick={() => navigate(`/my-loans/${l.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LoanCard({ loan: l, highlight, onClick }: { loan: Loan; highlight?: boolean; onClick: () => void }) {
  const pct = l.totalToPay ? Math.min(100, (l.paidAmount / l.totalToPay) * 100) : 0;
  const pending = Math.max(0, l.totalToPay - l.paidAmount);
  return (
    <Card className={cn("cursor-pointer p-5 transition-shadow hover:shadow-md md:p-6", highlight && "border-brand/30")} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {highlight ? "Tu préstamo · " : ""}Folio {l.number}
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{money(l.amount, 0)}</p>
          <p className="text-[13px] text-slate-500">
            {l.installments} meses · {money(l.monthlyPayment)} al mes
          </p>
        </div>
        <Pill tone={LOAN_COPY[l.status].tone}>{LOAN_COPY[l.status].label}</Pill>
      </div>
      {(l.status === "active" || l.status === "disbursed") && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Lo que debes</p>
              <p className="font-bold text-slate-900">{money(pending)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Próxima cuota</p>
              <p className="font-bold text-slate-900">{money(l.monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vence</p>
              <p className="font-bold text-slate-900">{shortDate(l.nextPaymentDate)}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      {l.status === "approved" && <p className="mt-3 text-sm font-semibold text-amber-700">Firma tu contrato para recibir el dinero →</p>}
    </Card>
  );
}

function Req({ ok, label, icon: Icon }: { ok: boolean; label: string; icon: React.ElementType }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Icon size={18} className="text-slate-400" />}
      <span className={ok ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      {!ok && <span className="text-xs font-semibold text-amber-600">Pendiente</span>}
    </li>
  );
}
