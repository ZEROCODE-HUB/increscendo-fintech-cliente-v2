/**
 * Kit visual del área de clientes (inspirado en Burxia): inputs de 48 px con
 * fondo teñido e ícono, botones redondeados, tarjetas suaves y hojas
 * inferiores en móvil.
 */
import React, { forwardRef, useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, Eye, EyeOff, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "../lib/rules";

/* ─────────────────────────────── Formularios ─────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
  className,
}: {
  label?: string;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
          {label}
          {optional && <span className="font-normal text-slate-400">(opcional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full h-12 rounded-xl border bg-slate-100/80 px-4 text-base md:text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition-all " +
  "focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60 disabled:cursor-not-allowed";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  right?: React.ReactNode;
  invalid?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput(
  { icon, right, invalid, className, ...props },
  ref,
) {
  return (
    <div className="group relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-slate-400 group-focus-within:text-brand [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          inputBase,
          icon && "pl-11",
          right && "pr-12",
          invalid ? "border-red-400 bg-red-50/60 focus:border-red-500 focus:ring-red-500/15" : "border-transparent",
          className,
        )}
        {...props}
      />
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "right">>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <TextInput
      ref={ref}
      type={show ? "text" : "password"}
      right={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      {...props}
    />
  );
});

export function SelectInput({
  icon,
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ReactNode; invalid?: boolean }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {icon}
        </span>
      )}
      <select
        className={cn(
          inputBase,
          "appearance-none pr-10",
          icon && "pl-11",
          invalid ? "border-red-400 bg-red-50/60" : "border-transparent",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function CheckRow({
  checked,
  onChange,
  children,
  invalid,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors",
        checked ? "border-brand/40 bg-brand-soft/60" : invalid ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
          checked ? "border-brand bg-brand text-white" : "border-slate-300 bg-white",
        )}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="leading-relaxed text-slate-700">{children}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
            value === o.value ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-slate-700",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────── Botones ──────────────────────────────── */

type BtnVariant = "primary" | "navy" | "outline" | "ghost" | "danger" | "soft" | "white";

const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand text-white shadow-[0_8px_20px_-8px_rgba(29,124,105,.65)] hover:bg-brand-dark",
  navy: "bg-brand-navy text-white hover:bg-brand-ink",
  outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  soft: "bg-brand-soft text-brand-dark hover:bg-brand/15",
  white: "bg-white text-brand-navy hover:bg-white/90",
};

export const Btn = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: React.ReactNode;
    block?: boolean;
  }
>(function Btn({ variant = "primary", size = "md", loading, icon, block, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-12 px-6 text-base",
        block && "w-full",
        BTN[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});

/* ──────────────────────────────── Superficies ──────────────────────────────── */

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]", className)} {...props}>
      {children}
    </div>
  );
}

const TONE: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/15",
  info: "bg-sky-50 text-sky-700 ring-sky-600/15",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/15",
  brand: "bg-brand-soft text-brand-dark ring-brand/20",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONE[tone], className)}>
      {children}
    </span>
  );
}

const ICON_TONE: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-soft text-brand",
};

export function IconBadge({ tone = "brand", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5", ICON_TONE[tone], className)}>{children}</span>;
}

export function Notice({ tone = "info", title, children, action }: { tone?: Tone; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const icon = tone === "danger" || tone === "warning" ? <AlertCircle size={18} /> : tone === "success" ? <Check size={18} /> : <Info size={18} />;
  return (
    <div className={cn("flex gap-3 rounded-xl p-3.5 text-sm ring-1 ring-inset", TONE[tone])}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("leading-relaxed", title && "mt-0.5 opacity-90")}>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: string | boolean;
  action?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex items-start gap-3 md:mb-7">
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 md:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  chevron = !!onClick,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left", onClick && "transition-colors hover:bg-slate-50", className)}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-slate-900">{title}</div>
        {subtitle && <div className="truncate text-[13px] text-slate-500">{subtitle}</div>}
      </div>
      {right}
      {chevron && <ChevronRight size={18} className="shrink-0 text-slate-300" />}
    </Comp>
  );
}

export function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <p className="font-bold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skel({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg bg-slate-200/70", className)} />;
}

/* ──────────────────────────────── Stepper ──────────────────────────────── */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= current ? "bg-brand" : "bg-slate-200")} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-brand">
          Paso {current + 1} de {steps.length}
        </span>
        <span className="font-semibold text-slate-700">{steps[current]}</span>
      </div>
    </div>
  );
}

/* ─────────────────────── Hoja (inferior en móvil, modal en escritorio) ─────────────────────── */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
  locked,
  side,
}: {
  locked?: boolean;
  /** En escritorio se abre como panel lateral derecho. */
  side?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          onEscapeKeyDown={locked ? (e) => e.preventDefault() : undefined}
          onPointerDownOutside={locked ? (e) => e.preventDefault() : undefined}
          className={cn(
            "fixed z-50 flex max-h-[92dvh] flex-col bg-white shadow-2xl outline-none",
            "inset-x-0 bottom-0 rounded-t-3xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            side
              ? "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl md:data-[state=open]:slide-in-from-right"
              : "md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:data-[state=open]:slide-in-from-bottom-4",
            !side && (wide ? "md:max-w-2xl" : "md:max-w-lg"),
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200 md:hidden" />
          <div className="flex items-start gap-3 px-5 pb-2 pt-4 md:px-6 md:pt-6">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-extrabold tracking-tight text-slate-900">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-slate-500">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {!locked && <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 md:px-6">{children}</div>
          {footer && <div className="border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Fila de resumen "etiqueta ··· valor". */
export function KV({ k, v, strong }: { k: React.ReactNode; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className={cn("text-right text-slate-900", strong ? "text-base font-extrabold" : "font-semibold")}>{v}</span>
    </div>
  );
}
