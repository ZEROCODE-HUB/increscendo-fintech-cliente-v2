import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell,
  Camera,
  CreditCard,
  Crown,
  FileText,
  HandCoins,
  HelpCircle,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Btn, Card, Field, IconBadge, ListRow, PageHeader, PasswordInput, Pill, SelectInput, Sheet, Skel, TextInput } from "../components/ui";
import { Avatar } from "../components/ClientLayout";
import { CK, useJourney, useRefresh } from "../hooks";
import { changePassword, formatAddress, updateProfile, uploadAvatar } from "../lib/api";
import { IS_DEMO } from "../lib/env";
import { setDemoScenario, type DemoScenario } from "../lib/demo";
import { initials, onlyDigits, shortDate } from "../lib/format";
import { KYC_COPY } from "../lib/rules";
import type { AddressParts } from "../lib/types";
import { ESTADOS_MX } from "./Register";

export default function Profile() {
  const j = useJourney();
  const { signOut, userId } = useAuth();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (j.isLoading || !j.profile) {
    return (
      <div className="space-y-4">
        <Skel className="h-32 rounded-3xl" />
        <Skel className="h-64 rounded-2xl" />
      </div>
    );
  }
  const p = j.profile;

  return (
    <div className="mx-auto max-w-3xl lg:max-w-6xl">
      <PageHeader title="Perfil" subtitle={<span className="hidden lg:inline">Tu cuenta, tus datos y tu seguridad.</span>} />

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="space-y-4 lg:sticky lg:top-24">
      <Card className="relative mb-5 overflow-hidden p-5 lg:mb-0 lg:p-6">
        <div className="absolute inset-x-0 top-0 h-14 bg-[linear-gradient(120deg,#0d1a2e,#13213a_55%,#123a40)] lg:h-20" />
        <div className="relative flex items-end gap-4 pt-9 lg:flex-col lg:items-center lg:pt-8 lg:text-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="Cambiar foto">
            <Avatar url={p.avatarUrl} text={initials(p.firstName, p.lastName)} className="h-20 w-20 text-2xl ring-4 ring-white" />
            <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-brand text-white ring-2 ring-white">
              <Camera size={14} />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f || !userId) return;
              if (f.size > 2 * 1024 * 1024) return toast.error("La imagen no debe superar 2 MB.");
              setUploading(true);
              try {
                await uploadAvatar(userId, f);
                await refresh(CK.profile);
                toast.success("Foto actualizada.");
              } catch (er) {
                toast.error((er as Error).message);
              } finally {
                setUploading(false);
              }
            }}
          />
          <div className="min-w-0 flex-1 pb-1 lg:w-full">
            <p className="truncate text-lg font-extrabold text-slate-900">
              {p.firstName} {p.lastName}
            </p>
            <p className="truncate text-sm text-slate-500">{p.email}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 lg:justify-center">
          {p.code && <Pill>Cliente {p.code}</Pill>}
          <Pill tone={KYC_COPY[j.kyc].tone}>Identidad: {KYC_COPY[j.kyc].label}</Pill>
          {j.hasMembership && <Pill tone="brand">Membresía {j.membership?.planName}</Pill>}
          {uploading && <Pill tone="info">Subiendo foto…</Pill>}
        </div>
        <div className="mt-5 hidden space-y-2 border-t border-slate-100 pt-4 text-left lg:block">
          <Mini label="Cliente desde" value={shortDate(p.createdAt)} />
          <Mini label="Membresía" value={j.hasMembership ? `${j.membership?.planName} · vence ${shortDate(j.membership?.expiresAt)}` : "Sin membresía"} />
          <Mini label="Identidad" value={KYC_COPY[j.kyc].label} />
        </div>
      </Card>
      <Btn
        variant="outline"
        size="lg"
        block
        className="hidden text-red-600 lg:flex"
        icon={<LogOut size={18} />}
        onClick={async () => {
          await signOut();
          navigate("/auth", { replace: true });
        }}
      >
        Cerrar sesión
      </Btn>
      </div>

      <div className="space-y-5">
        <Group title="Mi cuenta" grid>
          <ListRow icon={<IconBadge><ShieldCheck /></IconBadge>} title="Identidad y documentos" subtitle={KYC_COPY[j.kyc].help} right={<Pill tone={KYC_COPY[j.kyc].tone}>{KYC_COPY[j.kyc].label}</Pill>} onClick={() => navigate("/identidad")} />
          <ListRow
            icon={<IconBadge tone="neutral"><Crown /></IconBadge>}
            title="Membresía"
            subtitle={j.hasMembership ? `${j.membership?.planName} · vence ${shortDate(j.membership?.expiresAt)}` : "Sin membresía activa"}
            onClick={() => navigate("/memberships")}
          />
          <ListRow icon={<IconBadge tone="neutral"><Wallet /></IconBadge>} title="Métodos de pago" subtitle="Tarjetas y cuentas bancarias" onClick={() => navigate("/payment-methods")} />
          {j.loanInvited && <ListRow icon={<IconBadge tone="neutral"><HandCoins /></IconBadge>} title="Préstamos" onClick={() => navigate("/prestamos")} />}
          <ListRow icon={<IconBadge tone="neutral"><CreditCard /></IconBadge>} title="Mi tarjeta" onClick={() => navigate("/tarjeta")} />
          <ListRow icon={<IconBadge tone="neutral"><Bell /></IconBadge>} title="Notificaciones" onClick={() => navigate("/notifications")} />
        </Group>

        <Group title="Datos personales" action={<Btn size="sm" variant="soft" onClick={() => setEditOpen(true)}>Editar</Btn>}>
          <div className="hidden grid-cols-2 gap-x-8 gap-y-5 p-5 lg:grid">
            <Field2 label="Nombre(s)" value={p.firstName} />
            <Field2 label="Apellidos" value={p.lastName} />
            <Field2 label="Correo" value={p.email} hint="No editable" />
            <Field2 label="Celular" value={p.phone ? `${p.phoneCode} ${p.phone}` : "—"} />
            <Field2 label="Fecha de nacimiento" value={p.birthDate ? shortDate(p.birthDate) : "—"} />
            <Field2 label="RFC" value={p.rfc || "—"} />
            <Field2 label="Calle y número" value={p.addressParts ? [p.addressParts.calle, p.addressParts.numero, p.addressParts.interior ? `Int. ${p.addressParts.interior}` : ""].filter(Boolean).join(" ") : p.address || "—"} />
            <Field2 label="Colonia" value={p.addressParts?.colonia || "—"} />
            <Field2 label="Municipio o alcaldía" value={p.addressParts?.ciudad || "—"} />
            <Field2 label="Estado y C.P." value={p.addressParts ? `${p.addressParts.estado} · ${p.addressParts.cp}` : "—"} />
          </div>
          <div className="divide-y divide-slate-100 lg:hidden">
          <ListRow icon={<IconBadge tone="neutral"><UserRound /></IconBadge>} title={`${p.firstName} ${p.lastName}`} subtitle={p.birthDate ? `Nacimiento: ${shortDate(p.birthDate)}` : "Nombre completo"} />
          <ListRow icon={<IconBadge tone="neutral"><Mail /></IconBadge>} title={p.email} subtitle="Correo (no editable)" />
          <ListRow icon={<IconBadge tone="neutral"><Phone /></IconBadge>} title={p.phone ? `${p.phoneCode} ${p.phone}` : "Sin teléfono"} subtitle="Celular" />
          <ListRow icon={<IconBadge tone="neutral"><MapPin /></IconBadge>} title={p.addressParts ? formatAddress(p.addressParts) : p.address || "Sin domicilio"} subtitle="Domicilio" />
          </div>
        </Group>

        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
        <Group title="Seguridad">
          <ListRow icon={<IconBadge tone="neutral"><KeyRound /></IconBadge>} title="Cambiar contraseña" onClick={() => setPwOpen(true)} />
        </Group>

        <Group title="Ayuda y legal">
          <ListRow icon={<IconBadge tone="neutral"><HelpCircle /></IconBadge>} title="Centro de ayuda" onClick={() => navigate("/ayuda")} />
          <ListRow icon={<IconBadge tone="neutral"><FileText /></IconBadge>} title="Términos y condiciones" onClick={() => window.open("/terminos-y-condiciones", "_blank", "noopener")} />
          <ListRow icon={<IconBadge tone="neutral"><Lock /></IconBadge>} title="Aviso de privacidad" onClick={() => window.open("/politicas-privacidad", "_blank", "noopener")} />
        </Group>
        </div>

        {IS_DEMO && <DemoScenarios />}

        <Btn
          variant="outline"
          size="lg"
          block
          className="text-red-600 lg:hidden"
          icon={<LogOut size={18} />}
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
        >
          Cerrar sesión
        </Btn>
      </div>

      </div>
      <EditSheet open={editOpen} onOpenChange={setEditOpen} />
      <PasswordSheet open={pwOpen} onOpenChange={setPwOpen} email={p.email} />
    </div>
  );
}

function Group({ title, action, children, grid }: { title: string; action?: React.ReactNode; children: React.ReactNode; grid?: boolean }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">{title}</h2>
        {action}
      </div>
      <Card className={grid ? "grid divide-y divide-slate-100 overflow-hidden lg:grid-cols-2 lg:divide-y-0 lg:[&>*]:border-b lg:[&>*]:border-slate-100 lg:[&>*:nth-child(odd)]:border-r" : "divide-y divide-slate-100 overflow-hidden"}>
        {children}
      </Card>
    </section>
  );
}

function Field2({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400">
        {label}
        {hint && <span className="font-normal"> · {hint}</span>}
      </p>
      <p className="mt-0.5 truncate text-[15px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function EditSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { profile } = useJourney();
  const { userId } = useAuth();
  const refresh = useRefresh();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(() => ({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    birthDate: profile?.birthDate ?? "",
  }));
  const [a, setA] = useState<AddressParts>(
    profile?.addressParts ?? { calle: "", numero: "", interior: "", colonia: "", ciudad: "", estado: "", cp: "", pais: "México" },
  );
  React.useEffect(() => {
    if (open && profile) {
      setF({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone, birthDate: profile.birthDate });
      setA(profile.addressParts ?? { calle: "", numero: "", interior: "", colonia: "", ciudad: "", estado: "", cp: "", pais: "México" });
    }
  }, [open, profile]);
  const locked = profile?.kyc.status === "verificado";
  const sa = (k: keyof AddressParts) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setA((p) => ({ ...p, [k]: k === "cp" ? onlyDigits(e.target.value).slice(0, 5) : e.target.value }));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Datos personales"
      wide
      footer={
        <Btn
          block
          size="lg"
          loading={saving}
          onClick={async () => {
            if (!userId) return;
            if (onlyDigits(f.phone).length !== 10) return toast.error("El celular debe tener 10 dígitos.");
            setSaving(true);
            try {
              await updateProfile(userId, { ...f, phone: onlyDigits(f.phone), addressParts: a });
              await refresh(CK.profile);
              toast.success("Datos actualizados.");
              onOpenChange(false);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          Guardar cambios
        </Btn>
      }
    >
      <div className="space-y-4">
        {locked && <p className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-500">Tu identidad ya está verificada, por eso tu nombre no se puede editar aquí. Escríbenos si necesitas corregirlo.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre(s)">
            <TextInput value={f.firstName} disabled={locked} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
          </Field>
          <Field label="Apellidos">
            <TextInput value={f.lastName} disabled={locked} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
          </Field>
          <Field label="Celular">
            <TextInput icon={<Phone />} inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: onlyDigits(e.target.value).slice(0, 10) })} />
          </Field>
          <Field label="Fecha de nacimiento">
            <TextInput type="date" value={f.birthDate} disabled={locked} onChange={(e) => setF({ ...f, birthDate: e.target.value })} />
          </Field>
        </div>
        <p className="pt-1 text-[13px] font-bold uppercase tracking-wide text-slate-400">Domicilio</p>
        <Field label="Calle">
          <TextInput value={a.calle} onChange={sa("calle")} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="No. ext.">
            <TextInput value={a.numero} onChange={sa("numero")} />
          </Field>
          <Field label="No. int." optional>
            <TextInput value={a.interior} onChange={sa("interior")} />
          </Field>
          <Field label="C.P.">
            <TextInput inputMode="numeric" value={a.cp} onChange={sa("cp")} />
          </Field>
        </div>
        <Field label="Colonia">
          <TextInput value={a.colonia} onChange={sa("colonia")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Municipio o alcaldía">
            <TextInput value={a.ciudad} onChange={sa("ciudad")} />
          </Field>
          <Field label="Estado">
            <SelectInput value={a.estado} onChange={sa("estado")}>
              <option value="">Elige…</option>
              {ESTADOS_MX.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>
    </Sheet>
  );
}

function PasswordSheet({ open, onOpenChange, email }: { open: boolean; onOpenChange: (v: boolean) => void; email: string }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [saving, setSaving] = useState(false);
  const ok = cur && next.length >= 8 && next === conf;
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setCur("");
          setNext("");
          setConf("");
        }
      }}
      title="Cambiar contraseña"
      footer={
        <Btn
          block
          size="lg"
          disabled={!ok}
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await changePassword(email, cur, next);
              toast.success("Contraseña actualizada.");
              onOpenChange(false);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          Actualizar contraseña
        </Btn>
      }
    >
      <div className="space-y-4">
        <Field label="Contraseña actual">
          <PasswordInput icon={<Lock />} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
          <PasswordInput icon={<KeyRound />} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirma la nueva contraseña" error={conf && conf !== next ? "No coincide." : null}>
          <PasswordInput icon={<KeyRound />} value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />
        </Field>
      </div>
    </Sheet>
  );
}

function DemoScenarios() {
  const qc = useQueryClient();
  const opts: { v: DemoScenario; l: string; d: string }[] = [
    { v: "nuevo", l: "Cliente nuevo", d: "Sin documentos ni membresía" },
    { v: "miembro", l: "Miembro", d: "Identidad verificada y membresía activa" },
    { v: "invitado", l: "Invitado a préstamo", d: "Con préstamo activo" },
  ];
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-bold uppercase tracking-wider text-amber-600">
        <FlaskConical size={14} /> Escenario de demostración
      </div>
      <Card className="grid gap-2 p-3 sm:grid-cols-3">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={async () => {
              setDemoScenario(o.v);
              await qc.invalidateQueries({ queryKey: ["c"] });
              toast.success(`Escenario: ${o.l}`);
            }}
            className="rounded-xl border border-slate-200 p-3 text-left hover:border-amber-300 hover:bg-amber-50"
          >
            <p className="text-sm font-bold text-slate-900">{o.l}</p>
            <p className="text-xs text-slate-500">{o.d}</p>
          </button>
        ))}
      </Card>
    </section>
  );
}
