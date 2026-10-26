/**
 * Registro en 3 pasos: Cuenta → Datos y domicilio → Términos.
 * Sin documentos ni membresía: se piden ya dentro de la app (sin fricción para entrar).
 */
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CalendarDays, Hash, Home, Lock, Mail, MailCheck, MapPin, Phone, User } from "lucide-react";
import { AuthShell } from "../components/AuthShell";
import { Btn, Field, PasswordInput, SelectInput, Stepper, TextInput } from "../components/ui";
import { TermsContent } from "../components/TermsModal";
import { ApiError, signUp } from "../lib/api";
import { isValidEmail, onlyDigits } from "../lib/format";
import { cn } from "@/lib/utils";
import type { AddressParts } from "../lib/types";

export const ESTADOS_MX = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México",
  "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán",
  "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const STEPS = ["Tu cuenta", "Tus datos", "Términos"];

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}

const ageOf = (d: string) => {
  if (!d) return 0;
  const b = new Date(d);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState(false);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", phone: "", birthDate: "" });
  const [addr, setAddr] = useState<AddressParts>({ calle: "", numero: "", interior: "", colonia: "", ciudad: "", estado: "", cp: "", pais: "México" });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setA = (k: keyof AddressParts) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddr((p) => ({ ...p, [k]: k === "cp" ? onlyDigits(e.target.value).slice(0, 5) : e.target.value }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (f.firstName.trim().length < 2) e.firstName = "Escribe tu nombre.";
      if (f.lastName.trim().length < 2) e.lastName = "Escribe tus apellidos.";
      if (!isValidEmail(f.email)) e.email = "Escribe un correo válido.";
      if (f.password.length < 8) e.password = "Mínimo 8 caracteres.";
      else if (strength(f.password) < 2) e.password = "Combina mayúsculas, minúsculas y números.";
      if (f.confirm !== f.password) e.confirm = "Las contraseñas no coinciden.";
    }
    if (step === 1) {
      if (onlyDigits(f.phone).length !== 10) e.phone = "Escribe tu celular a 10 dígitos.";
      if (!f.birthDate) e.birthDate = "Elige tu fecha de nacimiento.";
      else if (ageOf(f.birthDate) < 18) e.birthDate = "Debes ser mayor de edad.";
      if (!addr.calle.trim()) e.calle = "Escribe la calle.";
      if (!addr.numero.trim()) e.numero = "Número exterior.";
      if (addr.cp.length !== 5) e.cp = "5 dígitos.";
      if (!addr.colonia.trim()) e.colonia = "Escribe la colonia.";
      if (!addr.ciudad.trim()) e.ciudad = "Escribe el municipio o alcaldía.";
      if (!addr.estado) e.estado = "Elige el estado.";
    }
    if (step === 2 && (!terms || !privacy)) e.terms = "Acepta ambos para continuar.";
    return e;
  }, [step, f, addr, terms, privacy]);

  const err = (k: string) => (tried ? errors[k] : undefined);

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) return;
    setTried(false);
    if (step < 2) return setStep(step + 1);
    setLoading(true);
    try {
      await signUp({
        email: f.email,
        password: f.password,
        firstName: f.firstName,
        lastName: f.lastName,
        phone: onlyDigits(f.phone),
        phoneCode: "+52",
        birthDate: f.birthDate,
        address: addr,
      });
      setDone(true);
    } catch (er) {
      const x = er as ApiError;
      toast.error(x.message);
      if (x.code === "exists") setStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="¡Ya casi!" subtitle="Confirma tu correo para entrar.">
        <div className="flex flex-col items-center text-center">
          <span className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-brand">
            <MailCheck size={38} />
          </span>
          <p className="text-[15px] leading-relaxed text-slate-600">
            Enviamos un enlace de confirmación a <b className="text-slate-900">{f.email}</b>. Ábrelo y después inicia sesión.
          </p>
          <p className="mt-2 text-sm text-slate-400">¿No lo ves? Revisa tu carpeta de spam.</p>
          <Btn size="lg" block className="mt-8" onClick={() => navigate("/auth", { replace: true })}>
            Ir a iniciar sesión
          </Btn>
        </div>
      </AuthShell>
    );
  }

  const pw = strength(f.password);

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Toma menos de 2 minutos."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth" className="font-bold text-brand hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} />
      <form onSubmit={next} className="space-y-4" noValidate>
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre(s)" error={err("firstName")}>
                <TextInput icon={<User />} autoComplete="given-name" value={f.firstName} onChange={set("firstName")} invalid={!!err("firstName")} placeholder="Mariana" />
              </Field>
              <Field label="Apellidos" error={err("lastName")}>
                <TextInput autoComplete="family-name" value={f.lastName} onChange={set("lastName")} invalid={!!err("lastName")} placeholder="López Herrera" />
              </Field>
            </div>
            <Field label="Correo electrónico" error={err("email")}>
              <TextInput icon={<Mail />} type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} invalid={!!err("email")} placeholder="tucorreo@ejemplo.com" />
            </Field>
            <Field label="Contraseña" error={err("password")}>
              <PasswordInput icon={<Lock />} autoComplete="new-password" value={f.password} onChange={set("password")} invalid={!!err("password")} placeholder="Mínimo 8 caracteres" />
              {f.password && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn("h-1 flex-1 rounded-full", i < pw ? (pw <= 1 ? "bg-red-400" : pw === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200")}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"][pw]}</span>
                </div>
              )}
            </Field>
            <Field label="Confirma tu contraseña" error={err("confirm")}>
              <PasswordInput icon={<Lock />} autoComplete="new-password" value={f.confirm} onChange={set("confirm")} invalid={!!err("confirm")} placeholder="Repite tu contraseña" />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Celular" error={err("phone")}>
                <TextInput
                  icon={<Phone />}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={f.phone}
                  onChange={(e) => setF((p) => ({ ...p, phone: onlyDigits(e.target.value).slice(0, 10) }))}
                  invalid={!!err("phone")}
                  placeholder="55 1234 5678"
                  right={<span className="pr-2 text-sm font-semibold text-slate-400">+52</span>}
                />
              </Field>
              <Field label="Fecha de nacimiento" error={err("birthDate")}>
                <TextInput icon={<CalendarDays />} type="date" value={f.birthDate} onChange={set("birthDate")} invalid={!!err("birthDate")} max={new Date().toISOString().slice(0, 10)} />
              </Field>
            </div>
            <div className="flex items-center gap-2 pt-2 text-[13px] font-bold uppercase tracking-wide text-slate-400">
              <MapPin size={14} /> Domicilio
            </div>
            <Field label="Calle" error={err("calle")}>
              <TextInput icon={<Home />} autoComplete="address-line1" value={addr.calle} onChange={setA("calle")} invalid={!!err("calle")} placeholder="Av. Insurgentes Sur" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="No. ext." error={err("numero")}>
                <TextInput value={addr.numero} onChange={setA("numero")} invalid={!!err("numero")} placeholder="1234" />
              </Field>
              <Field label="No. int." optional>
                <TextInput value={addr.interior} onChange={setA("interior")} placeholder="5" />
              </Field>
              <Field label="C.P." error={err("cp")}>
                <TextInput icon={<Hash />} inputMode="numeric" autoComplete="postal-code" value={addr.cp} onChange={setA("cp")} invalid={!!err("cp")} placeholder="03100" />
              </Field>
            </div>
            <Field label="Colonia" error={err("colonia")}>
              <TextInput value={addr.colonia} onChange={setA("colonia")} invalid={!!err("colonia")} placeholder="Del Valle" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Municipio o alcaldía" error={err("ciudad")}>
                <TextInput autoComplete="address-level2" value={addr.ciudad} onChange={setA("ciudad")} invalid={!!err("ciudad")} placeholder="Benito Juárez" />
              </Field>
              <Field label="Estado" error={err("estado")}>
                <SelectInput value={addr.estado} onChange={setA("estado")} invalid={!!err("estado")}>
                  <option value="">Elige…</option>
                  {ESTADOS_MX.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field label="País">
              <TextInput value={addr.pais ?? "México"} disabled />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <TermsContent terms={terms} privacy={privacy} onTerms={setTerms} onPrivacy={setPrivacy} invalid={tried} />
          </>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Btn type="button" variant="outline" size="lg" onClick={() => { setTried(false); setStep(step - 1); }} icon={<ArrowLeft size={18} />} aria-label="Atrás" className="px-4" />
          )}
          <Btn type="submit" size="lg" block loading={loading}>
            {step < 2 ? (
              <>
                Continuar <ArrowRight size={18} />
              </>
            ) : (
              "Crear mi cuenta"
            )}
          </Btn>
        </div>
      </form>
    </AuthShell>
  );
}
