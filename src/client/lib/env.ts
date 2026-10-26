/**
 * Configuración del área de clientes.
 *
 * Modo demostración: se activa con VITE_DEMO_MODE=true o cuando no hay
 * credenciales de Supabase. Permite navegar toda la app con datos de ejemplo
 * (sin backend). En producción basta con definir las variables reales.
 */
const env = import.meta.env;

export const SUPABASE_CONFIGURED = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
export const IS_DEMO = env.VITE_DEMO_MODE === "true" || !SUPABASE_CONFIGURED;

export const API_BASE_URL = "https://increscendo-api.vercel.app";
export const STORAGE_BUCKET = "documents";

/** Fase 2 (OneCard). Mientras sea false, "Mi tarjeta" muestra "Próximamente". */
export const FEATURE_CARDS = env.VITE_FEATURE_CARDS === "true" || IS_DEMO;

/**
 * Préstamos: "all" = visible para todo cliente con sesión (decide el admin al
 * aprobar); "invited" = solo con users.metadata.loan_eligible = true.
 */
export const LOANS_MODE: "all" | "invited" = env.VITE_LOANS_MODE === "invited" ? "invited" : "all";

/** Llave localStorage del último usuario (NO se borra al cerrar sesión). */
export const LAST_USER_KEY = "increscendo_last_user";
