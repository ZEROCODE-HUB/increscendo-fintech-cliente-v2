/** Tabla de movimientos para escritorio (en móvil se usa la lista). */
import React from "react";
import { ArrowDownLeft, CreditCard, Crown, HandCoins, ReceiptText, Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "./ui";
import type { Movement } from "../lib/types";
import { money } from "../lib/format";

export const KIND_LABEL: Record<Movement["kind"], string> = {
  membresia: "Membresía",
  prestamo: "Préstamo",
  cuota: "Cuota de préstamo",
  servicio: "Servicio",
  tarjeta: "Tarjeta",
};
const KIND_ICON: Record<Movement["kind"], React.ElementType> = {
  membresia: Crown,
  prestamo: HandCoins,
  cuota: ReceiptText,
  servicio: Zap,
  tarjeta: CreditCard,
};

const fDate = (d: string) => new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const fTime = (d: string) => new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

export function MovementsTable({ rows, compact, onRowClick }: { rows: Movement[]; compact?: boolean; onRowClick?: (m: Movement) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
            <th className="px-5 py-3 font-bold">Fecha</th>
            <th className="px-3 py-3 font-bold">Concepto</th>
            {!compact && <th className="px-3 py-3 font-bold">Tipo</th>}
            {!compact && <th className="px-3 py-3 font-bold">Medio / detalle</th>}
            {!compact && <th className="px-3 py-3 font-bold">Referencia</th>}
            <th className="px-3 py-3 font-bold">Estatus</th>
            <th className="px-5 py-3 text-right font-bold">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((m) => {
            const Icon = m.direction === "in" ? ArrowDownLeft : KIND_ICON[m.kind] ?? Wallet;
            return (
              <tr key={m.id} onClick={() => onRowClick?.(m)} className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-slate-50")}>
                <td className="whitespace-nowrap px-5 py-3">
                  <p className="font-semibold text-slate-800">{fDate(m.date)}</p>
                  <p className="text-xs text-slate-400">{fTime(m.date)}</p>
                </td>
                <td className={cn("px-3 py-3", compact && "max-w-0 w-full")}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        m.direction === "in" ? "bg-emerald-50 text-emerald-600" : m.status === "failed" ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{m.title}</p>
                      {compact && <p className="truncate text-xs text-slate-500">{KIND_LABEL[m.kind]} · {m.subtitle}</p>}
                    </div>
                  </div>
                </td>
                {!compact && <td className="whitespace-nowrap px-3 py-3 text-slate-600">{KIND_LABEL[m.kind]}</td>}
                {!compact && <td className="max-w-[200px] truncate px-3 py-3 text-slate-600">{m.subtitle}</td>}
                {!compact && <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500">{m.reference || "—"}</td>}
                <td className="whitespace-nowrap px-3 py-3">
                  <Pill tone={m.status === "ok" ? "success" : m.status === "pending" ? "warning" : "danger"}>{m.statusLabel}</Pill>
                </td>
                <td className={cn("whitespace-nowrap px-5 py-3 text-right font-bold tabular-nums", m.direction === "in" ? "text-emerald-600" : "text-slate-900", m.status === "failed" && "text-slate-400 line-through")}>
                  {m.direction === "in" ? "+" : "−"}
                  {money(m.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
