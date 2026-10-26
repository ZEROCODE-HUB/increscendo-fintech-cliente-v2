import React, { useState } from "react";
import { toast } from "sonner";
import { Building2, CreditCard, Plus, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Card, Empty, PageHeader, Pill, Sheet, Skel } from "../components/ui";
import { CardForm } from "../components/CardForm";
import { BankForm } from "../components/BankForm";
import { CK, useJourney, usePaymentMethods, useRefresh } from "../hooks";
import { removePaymentMethod, setDefaultCard } from "../lib/api";
import { maskClabe } from "../lib/format";
import type { PaymentMethod } from "../lib/types";

export default function PaymentMethods() {
  const { data, isLoading } = usePaymentMethods();
  const { profile } = useJourney();
  const { userId } = useAuth();
  const refresh = useRefresh();
  const [adding, setAdding] = useState<"card" | "bank" | null>(null);
  const [removing, setRemoving] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const cards = (data ?? []).filter((m) => m.type === "card");
  const banks = (data ?? []).filter((m) => m.type === "bank");

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh(CK.methods);
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Métodos de pago" subtitle="Tus tarjetas para pagar la membresía y tus cuentas bancarias." back="/mi-cuenta" />

      {isLoading ? (
        <Skel className="h-60 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900">Tarjetas</h2>
              <Btn size="sm" variant="soft" icon={<Plus size={15} />} onClick={() => setAdding("card")}>
                Agregar
              </Btn>
            </div>
            {cards.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c) => (
                  <div key={c.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy to-[#2b4a73] p-5 text-white shadow-md">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">{c.brand || "Tarjeta"}</span>
                      {c.isDefault && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">Principal</span>
                      )}
                    </div>
                    <p className="relative mt-6 font-mono text-lg tracking-[.2em]">•••• {c.last4}</p>
                    <div className="relative mt-3 flex items-end justify-between text-xs text-white/75">
                      <span className="truncate">{c.holderName}</span>
                      <span>{c.expiry}</span>
                    </div>
                    <div className="relative mt-4 flex gap-2">
                      {!c.isDefault && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => userId && act(() => setDefaultCard(userId, c), "Tarjeta principal actualizada.")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-bold hover:bg-white/25"
                        >
                          <Star size={13} /> Hacer principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoving(c)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-bold hover:bg-white/25"
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <Empty icon={<CreditCard />} title="Sin tarjetas" text="Agrega una tarjeta para pagar tu membresía al instante." action={<Btn onClick={() => setAdding("card")}>Agregar tarjeta</Btn>} />
              </Card>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-900">Cuentas bancarias</h2>
              <Btn size="sm" variant="soft" icon={<Plus size={15} />} onClick={() => setAdding("bank")}>
                Agregar
              </Btn>
            </div>
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {banks.length ? (
                banks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                      <Building2 size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{b.bankName}</p>
                      <p className="text-[13px] text-slate-500">
                        CLABE {maskClabe(b.clabe)} · {b.holderName}
                      </p>
                    </div>
                    <Pill tone={b.validation === "validada" ? "success" : "warning"}>{b.validation === "validada" ? "Validada" : "Por validar"}</Pill>
                    <button type="button" onClick={() => setRemoving(b)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <Empty icon={<Building2 />} title="Sin cuentas" text="Se usan para depósitos y domiciliación." />
              )}
            </Card>
          </section>
        </div>
      )}

      <Sheet open={adding === "card"} onOpenChange={(v) => !v && setAdding(null)} title="Agregar tarjeta" description="Débito o crédito, Visa, Mastercard o American Express.">
        <CardForm
          onDone={async () => {
            await refresh(CK.methods);
            setAdding(null);
          }}
        />
      </Sheet>
      <Sheet open={adding === "bank"} onOpenChange={(v) => !v && setAdding(null)} title="Agregar cuenta bancaria">
        <BankForm
          defaultHolder={profile ? `${profile.firstName} ${profile.lastName}` : ""}
          onDone={async () => {
            await refresh(CK.methods);
            setAdding(null);
          }}
        />
      </Sheet>
      <Sheet
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="¿Eliminar método?"
        description={removing?.type === "card" ? `Tarjeta •••• ${removing?.last4}` : `${removing?.bankName} ${maskClabe(removing?.clabe)}`}
        footer={
          <div className="flex gap-3">
            <Btn variant="outline" block onClick={() => setRemoving(null)}>
              Cancelar
            </Btn>
            <Btn
              variant="danger"
              block
              loading={busy}
              onClick={async () => {
                if (!removing) return;
                await act(() => removePaymentMethod(removing.id), "Método eliminado.");
                setRemoving(null);
              }}
            >
              Eliminar
            </Btn>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Si es tu tarjeta principal, tu próxima renovación necesitará otra tarjeta.</p>
      </Sheet>
    </div>
  );
}
