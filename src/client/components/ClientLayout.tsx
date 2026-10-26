/**
 * Layout del área de clientes.
 * - Escritorio (lg+): menú lateral azul marino + barra superior.
 * - Móvil: barra superior compacta + barra de pestañas inferior con
 *   "Servicios" como botón central (patrón de Burxia).
 * Las pantallas de flujo (checkout, solicitud de préstamo, Servicios embebido)
 * ocultan la barra inferior para que el usuario se concentre en terminar.
 */
import React, { Suspense } from "react";
import { NavLink, Outlet, useLoaderData, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Crown,
  HandCoins,
  HelpCircle,
  Home,
  LayoutGrid,
  LogOut,
  ReceiptText,
  UserRound,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Chatbot } from "@/components/Chatbot";
import MaintenancePage from "@/pages/MaintenancePage";
import type { AppSettings } from "@/services/settingsService";
import logoLight from "@/assets/logo-light.webp";
import logoIcon from "@/assets/logo-icon-color.webp";
import { useJourney, useNotifications } from "../hooks";
import { TermsGate } from "./TermsModal";
import { IS_DEMO, FEATURE_CARDS } from "../lib/env";
import { initials } from "../lib/format";

type NavItem = { to: string; label: string; icon: React.ElementType; match?: string[] };

const FOCUS_ROUTES = ["/membership-checkout", "/prestamos/solicitar", "/loan-process", "/loan-request", "/servicios-recargas", "/tarjeta/solicitar", "/tarjeta/invitacion"];

export function ClientLayout() {
  const settings = useLoaderData() as AppSettings | undefined;
  const { userRole } = useAuth();
  const location = useLocation();
  if (settings?.maintenance_web && userRole !== "admin") {
    return <MaintenancePage variant="web" message={settings.message} />;
  }
  const focus = FOCUS_ROUTES.some((r) => location.pathname.startsWith(r));
  const embed = location.pathname.startsWith("/servicios-recargas");

  return (
    <div className="min-h-[100dvh] bg-[#f3f5f8]">
      <DesktopSidebar />
      <div className="lg:pl-[264px]">
        {!embed && <TopBar focus={focus} />}
        <main
          className={cn(
            embed ? "" : "mx-auto w-full max-w-[1120px] px-4 pt-4 md:px-8 md:pt-6 lg:pt-8",
            !embed && (focus ? "pb-10" : "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-12"),
          )}
        >
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {!focus && <BottomTabs />}
      {!focus && (
        <div className={location.pathname === "/ayuda" ? "" : "hidden lg:block"}>
          <Chatbot />
        </div>
      )}
      <TermsGate />
      {IS_DEMO && <DemoBadge />}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand border-t-transparent" />
    </div>
  );
}

function useNav(): NavItem[] {
  const { loanInvited } = useJourney();
  const items: NavItem[] = [
    { to: "/dashboard", label: "Inicio", icon: Home },
    { to: "/memberships", label: "Membresía", icon: Crown, match: ["/membership-checkout"] },
    { to: "/servicios", label: "Servicios", icon: Zap, match: ["/servicios-recargas"] },
    { to: "/history", label: "Movimientos", icon: ReceiptText },
  ];
  if (FEATURE_CARDS) items.push({ to: "/tarjeta", label: "Mi tarjeta", icon: CreditCard });
  if (loanInvited) items.push({ to: "/prestamos", label: "Préstamos", icon: HandCoins, match: ["/my-loans", "/loan-process", "/loan-request"] });
  return items;
}

const isActive = (pathname: string, item: NavItem) =>
  pathname === item.to || pathname.startsWith(item.to + "/") || (item.match ?? []).some((m) => pathname.startsWith(m));

function DesktopSidebar() {
  const nav = useNav();
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { profile } = useJourney();

  const link = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          "group flex h-11 items-center gap-3 rounded-xl px-3.5 text-[14.5px] font-semibold transition-colors",
          active ? "bg-white/[.12] text-white" : "text-white/65 hover:bg-white/[.06] hover:text-white",
        )}
      >
        <Icon size={19} className={cn(active ? "text-[#5fd3bb]" : "text-white/55 group-hover:text-white/80")} />
        {item.label}
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5fd3bb]" />}
      </NavLink>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-brand-navy lg:flex">
      <div className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full bg-brand-cyan/10 blur-3xl" />
      <div className="px-6 pb-6 pt-7">
        <img src={logoLight} alt="Increscendo Fintech" className="h-9 w-auto" />
      </div>
      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map(link)}
        <div className="!my-4 mx-3 h-px bg-white/10" />
        {link({ to: "/mi-cuenta", label: "Perfil", icon: UserRound, match: ["/identidad", "/payment-methods", "/notifications"] })}
        {link({ to: "/ayuda", label: "Ayuda", icon: HelpCircle })}
      </nav>
      <div className="relative m-3 flex items-center gap-3 rounded-2xl bg-white/[.06] p-3">
        <Avatar url={profile?.avatarUrl} text={initials(profile?.firstName, profile?.lastName)} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{profile ? `${profile.firstName} ${profile.lastName}` : "—"}</p>
          <p className="truncate text-xs text-white/50">{profile?.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}

function TopBar({ focus }: { focus: boolean }) {
  const { profile } = useJourney();
  const { data: notes } = useNotifications();
  const unread = (notes ?? []).filter((n) => !n.read).length;
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#f3f5f8]/85 backdrop-blur-md lg:border-0 lg:bg-transparent lg:backdrop-blur-0">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-4 md:h-16 md:px-8 lg:h-[72px]">
        <button type="button" onClick={() => navigate("/dashboard")} className="flex items-center gap-2 lg:hidden" aria-label="Inicio">
          <img src={logoIcon} alt="" className="h-8 w-8" />
          <span className="text-[15px] font-extrabold tracking-tight text-brand-navy">Increscendo</span>
        </button>
        <div className="flex-1" />
        {!focus && (
          <>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#f3f5f8]">
                  {unread}
                </span>
              )}
            </button>
            <button type="button" onClick={() => navigate("/mi-cuenta")} className="lg:hidden" aria-label="Perfil">
              <Avatar url={profile?.avatarUrl} text={initials(profile?.firstName, profile?.lastName)} className="h-10 w-10" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export function Avatar({ url, text, className }: { url?: string | null; text: string; className?: string }) {
  return url ? (
    <img src={url} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span className={cn("grid place-items-center rounded-full bg-gradient-to-br from-brand-accent to-brand-cyan text-sm font-bold text-white", className)}>
      {text}
    </span>
  );
}

function BottomTabs() {
  const { pathname } = useLocation();
  const tabs: (NavItem & { center?: boolean })[] = [
    { to: "/dashboard", label: "Inicio", icon: Home },
    FEATURE_CARDS
      ? { to: "/tarjeta", label: "Tarjeta", icon: CreditCard }
      : { to: "/memberships", label: "Membresía", icon: Crown, match: ["/membership-checkout"] },
    { to: "/servicios", label: "Servicios", icon: LayoutGrid, center: true, match: ["/servicios-recargas"] },
    { to: "/history", label: "Movimientos", icon: ReceiptText },
    { to: "/mi-cuenta", label: "Perfil", icon: UserRound, match: ["/identidad", "/payment-methods", "/notifications", "/my-loans", "/prestamos", ...(FEATURE_CARDS ? ["/memberships"] : [])] },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-brand-navy pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-14px_rgba(7,15,28,.55)] lg:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-end px-2">
        {tabs.map((t) => {
          const active = isActive(pathname, t);
          const Icon = t.icon;
          if (t.center) {
            return (
              <NavLink key={t.to} to={t.to} className="flex flex-col items-center pb-2" aria-label={t.label}>
                <span
                  className={cn(
                    "-mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2bb393] to-brand text-white shadow-[0_10px_24px_-6px_rgba(35,149,126,.7)] ring-4 ring-brand-navy transition-transform active:scale-95",
                    active && "from-brand-accent to-brand-dark",
                  )}
                >
                  <Icon size={24} />
                </span>
                <span className={cn("mt-1 text-[11px] font-semibold", active ? "text-[#5fd3bb]" : "text-white/55")}>{t.label}</span>
              </NavLink>
            );
          }
          return (
            <NavLink key={t.to} to={t.to} className="relative flex flex-col items-center gap-1 pb-2 pt-2">
              {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-[#5fd3bb]" />}
              <Icon size={22} strokeWidth={active ? 2.4 : 1.9} className={active ? "text-[#5fd3bb]" : "text-white/55"} />
              <span className={cn("text-[11px] font-semibold", active ? "text-white" : "text-white/55")}>{t.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function DemoBadge() {
  return (
    <div className="pointer-events-none fixed left-1/2 top-1.5 z-50 -translate-x-1/2 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow lg:left-auto lg:right-4 lg:top-auto lg:bottom-4 lg:translate-x-0">
      Demo
    </div>
  );
}
