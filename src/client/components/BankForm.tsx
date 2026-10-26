import React, { useState } from "react";
import { toast } from "sonner";
import { Building2, Hash, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Btn, Field, SelectInput, TextInput } from "./ui";
import { useBanks } from "../hooks";
import { addBankAccount } from "../lib/api";
import { isValidClabe, onlyDigits } from "../lib/format";
import type { PaymentMethod } from "../lib/types";

export function BankForm({ defaultHolder, onDone, submitLabel = "Guardar cuenta" }: { defaultHolder?: string; onDone: (m: PaymentMethod) => void; submitLabel?: string }) {
  const { userId } = useAuth();
  const { data: banks } = useBanks();
  const [bank, setBank] = useState("");
  const [clabe, setClabe] = useState("");
  const [holder, setHolder] = useState(defaultHolder ?? "");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const errs = {
    bank: bank ? null : "Elige tu banco.",
    clabe: isValidClabe(clabe) ? null : "La CLABE tiene 18 dígitos.",
    holder: holder.trim().length > 3 ? null : "Escribe el nombre del titular.",
  };
  return (
    <div className="space-y-4">
      <Field label="Banco" error={tried ? errs.bank : null}>
        <SelectInput icon={<Building2 />} value={bank} onChange={(e) => setBank(e.target.value)} invalid={tried && !!errs.bank}>
          <option value="">Elige tu banco…</option>
          {(banks ?? []).map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="CLABE interbancaria" hint={`${clabe.length}/18 dígitos`} error={tried ? errs.clabe : null}>
        <TextInput icon={<Hash />} inputMode="numeric" value={clabe} onChange={(e) => setClabe(onlyDigits(e.target.value).slice(0, 18))} invalid={tried && !!errs.clabe} placeholder="012 180 0000000000 0" />
      </Field>
      <Field label="Titular de la cuenta" hint="Debe ser la misma persona de la cuenta Increscendo." error={tried ? errs.holder : null}>
        <TextInput icon={<User />} value={holder} onChange={(e) => setHolder(e.target.value)} invalid={tried && !!errs.holder} />
      </Field>
      <Btn
        block
        size="lg"
        loading={saving}
        onClick={async () => {
          setTried(true);
          if (Object.values(errs).some(Boolean) || !userId) return;
          setSaving(true);
          try {
            const m = await addBankAccount(userId, bank, clabe, holder.trim());
            toast.success("Cuenta guardada.");
            onDone(m);
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        {submitLabel}
      </Btn>
    </div>
  );
}
