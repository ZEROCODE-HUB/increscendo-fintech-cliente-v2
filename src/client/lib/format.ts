export const money = (n: number | null | undefined, decimals = 2) =>
  `$${Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** Las fechas sin hora ("1990-02-15") se interpretan a mediodía local para no correrse un día. */
const asDate = (d: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

export const shortDate = (d: string | null | undefined) =>
  d ? asDate(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const dayMonth = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "—";

export const dateTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? "").trim()[0] ?? ""}${(last ?? "").trim()[0] ?? ""}`.toUpperCase() || "U";

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function maskClabe(clabe?: string | null) {
  if (!clabe) return "—";
  return `•••• ${clabe.slice(-4)}`;
}

/** Cuota mensual con amortización francesa (tasa anual en %). */
export function monthlyPayment(amount: number, months: number, annualRatePct: number) {
  const r = annualRatePct / 100 / 12;
  if (!amount || !months) return 0;
  if (r === 0) return amount / months;
  return (amount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export const isValidClabe = (v: string) => /^\d{18}$/.test(v);
export const isValidRfc = (v: string) => /^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/i.test(v.trim());
export const isValidCurp = (v: string) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i.test(v.trim());
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
