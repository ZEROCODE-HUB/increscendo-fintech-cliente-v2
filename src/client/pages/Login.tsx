import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Lock, Mail, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "../components/AuthShell";
import { Btn, Field, Notice, PasswordInput, Sheet, TextInput } from "../components/ui";
import { ApiError, clearLastUser, getLastUser, requestPasswordReset, signIn, type LastUser } from "../lib/api";
import { IS_DEMO } from "../lib/env";
import { isValidEmail } from "../lib/format";
import Register from "./Register";

export default function AuthPage() {
  const [params] = useSearchParams();
  return params.get("mode") === "register" ? <Register /> : <Login />;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saved, setSaved] = useState<LastUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const u = getLastUser();
    if (u) {
      setSaved(u);
      setEmail(u.email);
    }
  }, []);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnconfirmed(false);
    if (!isValidEmail(email)) return setError("Escribe un correo válido.");
    if (!password) return setError("Escribe tu contraseña.");
    setLoading(true);
    try {
      const r = await signIn(email, password);
      if (r.role?.toLowerCase() === "admin") navigate("/admin/dashboard", { replace: true });
      else navigate(from && from !== "/auth" ? from : "/dashboard", { replace: true, state: r.firstLogin ? { welcome: true } : undefined });
    } catch (err) {
      const e2 = err as ApiError;
      if (e2.code === "email_not_confirmed") setUnconfirmed(true);
      setError(e2.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (IS_DEMO) return toast.success("Te reenviamos el correo de confirmación.");
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
    if (err) toast.error("No pudimos reenviar el correo. Intenta en unos minutos.");
    else toast.success("Te reenviamos el correo de confirmación.");
  };

  return (
    <AuthShell
      title={saved ? `Hola de nuevo, ${saved.firstName || "👋"}` : "Inicia sesión"}
      subtitle={saved ? "Escribe tu contraseña para entrar." : "Entra a tu cuenta Increscendo."}
      showFeatures={!saved}
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/auth?mode=register" className="font-bold text-brand hover:underline">
            Crea tu cuenta gratis
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {saved ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-accent to-brand-cyan text-lg font-bold text-white">
              {(saved.firstName?.[0] ?? saved.email[0]).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-slate-900">{saved.firstName || "Tu cuenta"}</p>
              <p className="truncate text-[13px] text-slate-500">{saved.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearLastUser();
                setSaved(null);
                setEmail("");
                setPassword("");
              }}
              className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-brand hover:bg-brand-soft"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <Field label="Correo electrónico" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              icon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={!!error && !isValidEmail(email)}
            />
          </Field>
        )}

        <Field label="Contraseña" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            icon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus={!!saved}
          />
        </Field>

        <div className="flex justify-end">
          <button type="button" onClick={() => setResetOpen(true)} className="text-sm font-semibold text-slate-500 hover:text-brand">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <Notice tone="danger" action={unconfirmed ? <Btn type="button" size="sm" variant="outline" onClick={resend}>Reenviar correo</Btn> : undefined}>
            {error}
          </Notice>
        )}

        <Btn type="submit" size="lg" block loading={loading} icon={!loading && <ArrowRight size={18} />} className="flex-row-reverse">
          {loading ? "Entrando…" : "Entrar"}
        </Btn>

        {IS_DEMO && (
          <p className="text-center text-xs text-slate-400">Modo demostración: cualquier contraseña de 4+ caracteres funciona.</p>
        )}
      </form>

      <ResetSheet open={resetOpen} onOpenChange={setResetOpen} initialEmail={email} />
    </AuthShell>
  );
}

function ResetSheet({ open, onOpenChange, initialEmail }: { open: boolean; onOpenChange: (v: boolean) => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setSent(false);
    }
  }, [open, initialEmail]);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={sent ? "Revisa tu correo" : "Recupera tu contraseña"}
      description={sent ? undefined : "Te enviaremos un enlace para crear una nueva."}
      footer={
        sent ? (
          <Btn block size="lg" variant="outline" onClick={() => onOpenChange(false)}>
            Entendido
          </Btn>
        ) : (
          <Btn
            block
            size="lg"
            loading={loading}
            disabled={!isValidEmail(email)}
            onClick={async () => {
              setLoading(true);
              try {
                await requestPasswordReset(email);
                setSent(true);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Enviar enlace
          </Btn>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
            <MailCheck size={26} />
          </span>
          <p className="text-sm text-slate-600">
            Si <b>{email}</b> tiene una cuenta, recibirás un enlace en unos minutos. Revisa también tu carpeta de spam.
          </p>
        </div>
      ) : (
        <Field label="Correo electrónico">
          <TextInput type="email" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
        </Field>
      )}
    </Sheet>
  );
}
