import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Check, CheckCircle2, ExternalLink, FileSignature, FlaskConical, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn, Card, Empty, KV, Notice, PageHeader, Pill, Sheet, Skel } from "../components/ui";
import { CK, useLoans, useRefresh } from "../hooks";
import {
  confirmLoanSigned,
  demoAdvanceLoan,
  getInstallments,
  installmentFailed,
  installmentPaid,
  installmentProcessing,
  payInstallments,
} from "../lib/api";
import { IS_DEMO } from "../lib/env";
import { maskClabe, money, shortDate } from "../lib/format";
import { LOAN_COPY } from "../lib/rules";
import type { Loan, LoanStatus } from "../lib/types";

const TIMELINE: { s: LoanStatus[]; label: string }[] = [
  { s: ["pending", "under_review"], label: "En revisión" },
  { s: ["approved"], label: "Aprobado" },
  { s: ["signed"], label: "Contrato firmado" },
  { s: ["disbursed"], label: "Dinero depositado" },
  { s: ["active", "paid"], label: "Pagando" },
];

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: loans, isLoading } = useLoans();
  const refresh = useRefresh();
  const loan = (loans ?? []).find((l) => l.id === id);

  // Mientras espera revisión o firma, revisa el estatus cada 15 s.
  useEffect(() => {
    if (!loan || !["pending", "under_review", "approved", "signed"].includes(loan.status)) return;
    const t = setInterval(() => void refresh(CK.loans), 15000);
    return () => clearInterval(t);
  }, [loan?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <Skel className="mx-auto h-96 max-w-3xl rounded-2xl" />;
  if (!loan) {
    return (
      <Card className="mx-auto max-w-xl">
        <Empty icon={<AlertCircle />} title="No encontramos este préstamo" action={<Btn onClick={() => navigate("/prestamos")}>Ver mis préstamos</Btn>} />
      </Card>
    );
  }
  const rejected = loan.status === "rejected" || loan.status === "cancelled";
  const idx = TIMELINE.findIndex((t) => t.s.includes(loan.status));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Préstamo ${money(loan.amount, 0)}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Pill tone={LOAN_COPY[loan.status].tone}>{LOAN_COPY[loan.status].label}</Pill>
            <span>
              Folio {loan.number} · {shortDate(loan.appliedAt)}
            </span>
          </span>
        }
        back="/prestamos"
      />

      <div className="space-y-5">
        {rejected ? (
          <Notice tone="danger" title="Tu solicitud no fue aprobada">
            {loan.rejectionMessage || "Por ahora no podemos ofrecerte este préstamo. Si tienes dudas, escríbenos desde el chat."}
          </Notice>
        ) : (
          <Card className="p-5">
            <ol className="flex items-start">
              {TIMELINE.map((t, i) => {
                const done = i < idx || loan.status === "paid";
                const cur = i === idx && loan.status !== "paid";
                return (
                  <li key={t.label} className="relative flex flex-1 flex-col items-center text-center">
                    {i > 0 && <span className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", i <= idx ? "bg-brand" : "bg-slate-200")} />}
                    <span
                      className={cn(
                        "relative z-[1] grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                        done ? "bg-brand text-white" : cur ? "bg-white text-brand ring-2 ring-brand" : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn("mt-2 text-[11px] font-semibold leading-tight", cur ? "text-slate-900" : "text-slate-400")}>{t.label}</span>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

        <StageAction loan={loan} />

        <Card className="px-5 py-3">
          <KV k="Monto" v={money(loan.amount)} />
          <KV k="Plazo" v={`${loan.installments} meses`} />
          <KV k="Pago mensual" v={money(loan.monthlyPayment)} />
          <KV k="Tasa anual" v={`${loan.interestRate}%`} />
          <KV k="Total a pagar" v={money(loan.totalToPay)} />
          {loan.bankName && <KV k="Cuenta" v={`${loan.bankName} ${maskClabe(loan.clabe)}`} />}
          {loan.disbursedAt && <KV k="Depositado" v={shortDate(loan.disbursedAt)} />}
        </Card>

        {(loan.status === "active" || loan.status === "disbursed" || loan.status === "paid") && <Schedule loan={loan} />}

        {IS_DEMO && ["under_review", "approved", "signed", "disbursed"].includes(loan.status) && (
          <Btn
            variant="outline"
            block
            icon={<FlaskConical size={16} />}
            onClick={async () => {
              demoAdvanceLoan(loan.id);
              await refresh(CK.loans);
            }}
          >
            Demo: avanzar al siguiente estado
          </Btn>
        )}
      </div>
    </div>
  );
}

function StageAction({ loan }: { loan: Loan }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  if (loan.status === "pending" || loan.status === "under_review") {
    return (
      <Notice tone="info" title="Estamos revisando tu solicitud">
        Te avisaremos por correo en menos de 24 h hábiles. No necesitas hacer nada más.
      </Notice>
    );
  }
  if (loan.status === "approved") {
    return (
      <Card className="border-amber-200 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
          <FileSignature className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-bold text-slate-900">¡Aprobado! Firma tu contrato</p>
            <p className="mt-1 text-sm text-slate-600">Te enviamos el contrato por correo para firmarlo electrónicamente con SignNow. En cuanto lo firmes depositamos tu dinero.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {loan.signUrl && (
                <Btn onClick={() => window.open(loan.signUrl!, "_blank", "noopener")} icon={<ExternalLink size={16} />}>
                  Firmar ahora
                </Btn>
              )}
              <Btn
                variant={loan.signUrl ? "outline" : "primary"}
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await confirmLoanSigned(loan.id);
                    await refresh(CK.loans);
                    toast.success("¡Gracias! Registramos tu firma.");
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Ya firmé mi contrato
              </Btn>
            </div>
            <p className="mt-3 text-xs text-slate-500">¿No te llegó el correo? Revisa spam o escríbenos desde el chat.</p>
          </div>
        </div>
      </Card>
    );
  }
  if (loan.status === "signed") {
    return (
      <Notice tone="success" title="Contrato firmado">
        Estamos preparando tu depósito a {loan.bankName} {maskClabe(loan.clabe)}. Normalmente llega en menos de 24 horas.
      </Notice>
    );
  }
  if (loan.status === "paid") {
    return (
      <Notice tone="success" title="¡Préstamo liquidado!">
        Gracias por pagar a tiempo.
      </Notice>
    );
  }
  return null;
}

function Schedule({ loan }: { loan: Loan }) {
  const refresh = useRefresh();
  const { data: rows, isLoading } = useQuery({ queryKey: CK.installments(loan.id), queryFn: () => getInstallments(loan) });
  const [sel, setSel] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [paying, setPaying] = useState(false);
  const selectable = useMemo(() => (rows ?? []).filter((r) => !installmentPaid(r.status) && !installmentProcessing(r.status)), [rows]);
  const paidCount = (rows ?? []).filter((r) => installmentPaid(r.status)).length;
  const selTotal = sel.length * loan.monthlyPayment;

  const toggle = (n: number) => {
    // Solo se pueden adelantar cuotas en orden (no saltarse una).
    const order = selectable.map((s) => s.number);
    const pos = order.indexOf(n);
    setSel(sel.includes(n) ? order.slice(0, pos) : order.slice(0, pos + 1));
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <p className="text-[15px] font-bold text-slate-900">Calendario de pagos</p>
        <span className="text-xs font-bold text-slate-400">
          {paidCount} de {loan.installments} pagadas
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skel className="h-10" />
          <Skel className="h-10" />
          <Skel className="h-10" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {(rows ?? []).map((r) => {
            const paid = installmentPaid(r.status);
            const proc = installmentProcessing(r.status);
            const failed = installmentFailed(r.status);
            const can = !paid && !proc;
            const on = sel.includes(r.number);
            return (
              <li key={r.number}>
                <button type="button" disabled={!can} onClick={() => toggle(r.number)} className={cn("flex w-full items-center gap-3 px-5 py-3 text-left", can && "hover:bg-slate-50", on && "bg-brand-soft/50")}>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border-2",
                      paid ? "border-emerald-500 bg-emerald-500 text-white" : on ? "border-brand bg-brand text-white" : proc ? "border-amber-300" : "border-slate-300",
                    )}
                  >
                    {paid || on ? <Check size={13} strokeWidth={3} /> : proc ? <Loader2 size={12} className="animate-spin text-amber-500" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Cuota {r.number}</p>
                    <p className={cn("text-xs", failed ? "text-red-600" : "text-slate-500")}>
                      {failed ? r.failedReason || "No se pudo cobrar" : `Vence ${shortDate(r.dueDate)}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900">{money(r.amount)}</span>
                  {paid ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : failed ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <span className="w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selectable.length > 0 && (
        <div className="border-t border-slate-100 p-4">
          <Btn block size="lg" disabled={!sel.length} onClick={() => setConfirm(true)}>
            {sel.length ? `Pagar ${sel.length} cuota${sel.length > 1 ? "s" : ""} · ${money(selTotal)}` : "Selecciona cuotas para adelantar"}
          </Btn>
        </div>
      )}
      <Sheet
        open={confirm}
        onOpenChange={setConfirm}
        title="Confirmar pago"
        description={`Cobraremos ${money(selTotal)} a tu cuenta ${loan.bankName ?? ""} ${maskClabe(loan.clabe)}.`}
        footer={
          <Btn
            block
            size="lg"
            loading={paying}
            onClick={async () => {
              setPaying(true);
              try {
                const r = await payInstallments(loan, sel);
                toast.success(r.partial ? "Se procesó parte del pago. Revisa el detalle." : "Pago en proceso. Te avisaremos cuando se confirme.");
                setSel([]);
                setConfirm(false);
                await refresh(CK.installments(loan.id), CK.loans, CK.movements);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setPaying(false);
              }
            }}
          >
            Confirmar pago
          </Btn>
        }
      >
        <div className="rounded-2xl bg-slate-50 px-4 py-2">
          <KV k="Cuotas" v={sel.join(", ")} />
          <KV k="Total" v={money(selTotal)} strong />
        </div>
      </Sheet>
    </Card>
  );
}
