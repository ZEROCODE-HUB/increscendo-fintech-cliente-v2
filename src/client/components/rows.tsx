import React from "react";
import { ArrowDownLeft, Crown, HandCoins, ReceiptText, Wallet, Zap, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Movement } from "../lib/types";
import { dayMonth, money } from "../lib/format";

const KIND_ICON: Record<Movement["kind"], React.ElementType> = {
  membresia: Crown,
  prestamo: HandCoins,
  cuota: ReceiptText,
  servicio: Zap,
  tarjeta: CreditCard,
};

export function MovementRow({ m, onClick }: { m: Movement; onClick?: () => void }) {
  const Icon = m.direction === "in" ? ArrowDownLeft : KIND_ICON[m.kind] ?? Wallet;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          m.direction === "in" ? "bg-emerald-50 text-emerald-600" : m.status === "failed" ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600",
        )}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-slate-900">{m.title}</p>
        <p className="truncate text-[12.5px] text-slate-500">
          {m.subtitle} · {dayMonth(m.date)}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-[14.5px] font-bold tabular-nums", m.direction === "in" ? "text-emerald-600" : "text-slate-900", m.status === "failed" && "text-slate-400 line-through")}>
          {m.direction === "in" ? "+" : "−"}
          {money(m.amount)}
        </p>
        <p
          className={cn(
            "text-[11.5px] font-semibold",
            m.status === "ok" ? "text-slate-400" : m.status === "pending" ? "text-amber-600" : "text-red-500",
          )}
        >
          {m.statusLabel}
        </p>
      </div>
    </button>
  );
}
