/**
 * Capa de datos del área de clientes.
 *
 * Cada función tiene dos caminos: el real (Supabase + increscendo-api) y el de
 * demostración (IS_DEMO). Las pantallas solo llaman a estas funciones, así que
 * conectar o ajustar un endpoint no obliga a tocar la interfaz.
 */
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { increscendoApiFetch } from "@/lib/increscendoApi";
import { sendEmail } from "@/lib/emailService";
import { membershipAcquiredTemplate } from "@/lib/emailTemplates";
import { IS_DEMO, LAST_USER_KEY, STORAGE_BUCKET } from "./env";
import { DEMO_AUTH_KEY, DEMO_PLANS, demoInstallments, demoState, saveDemo, wait } from "./demo";
import type {
  AddressParts,
  Bank,
  CardState,
  DocKey,
  Installment,
  KycStatus,
  Loan,
  LoanStatus,
  Movement,
  Notification,
  PaymentMethod,
  Plan,
  Profile,
  UserMembership,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- filas sin tipar de Supabase
type Row = Record<string, any>;

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/* ───────────────────────── Último usuario (login) ───────────────────────── */

export type LastUser = { email: string; firstName: string };

export function getLastUser(): LastUser | null {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    return raw ? (JSON.parse(raw) as LastUser) : null;
  } catch {
    return null;
  }
}
export function setLastUser(u: LastUser) {
  try {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify(u));
  } catch {
    /* noop */
  }
}
export function clearLastUser() {
  try {
    localStorage.removeItem(LAST_USER_KEY);
  } catch {
    /* noop */
  }
}

/* ───────────────────────────────── Auth ───────────────────────────────── */

const AUTH_ERRORS: Record<string, string> = {
  "invalid login credentials": "Correo o contraseña incorrectos.",
  "email not confirmed": "Aún no confirmas tu correo. Revisa tu bandeja de entrada.",
  "user already registered": "Este correo ya tiene una cuenta. Inicia sesión.",
  "password should be at least": "La contraseña debe tener al menos 8 caracteres.",
  "rate limit": "Demasiados intentos. Espera un momento e intenta de nuevo.",
};
export function authMessage(raw?: string | null) {
  const m = (raw ?? "").toLowerCase();
  for (const [k, v] of Object.entries(AUTH_ERRORS)) if (m.includes(k)) return v;
  return raw || "Ocurrió un error. Intenta de nuevo.";
}

export type SignInResult = { firstName: string; role: string; firstLogin: boolean };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (IS_DEMO) {
    await wait(700);
    if (password.length < 4) throw new ApiError("Correo o contraseña incorrectos.");
    const st = demoState();
    try {
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ email: email || st.profile.email }));
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event("inc-demo-auth"));
    setLastUser({ email: email || st.profile.email, firstName: st.profile.firstName });
    return { firstName: st.profile.firstName, role: "client", firstLogin: false };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user) throw new ApiError(authMessage(error?.message));
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    throw new ApiError("Aún no confirmas tu correo. Revisa tu bandeja de entrada.", "email_not_confirmed");
  }
  const { data: row } = await supabase
    .from("users")
    .select("role, first_name, last_name, avatar_url, address, metadata")
    .eq("id", data.user.id)
    .maybeSingle();
  const firstName = row?.first_name || (data.user.user_metadata?.first_name as string) || "";
  try {
    localStorage.setItem(
      "increscendo_user",
      JSON.stringify({ id: data.user.id, email: data.user.email, first_name: row?.first_name, last_name: row?.last_name, role: row?.role, avatar_url: row?.avatar_url }),
    );
  } catch {
    /* noop */
  }
  setLastUser({ email: data.user.email ?? email, firstName });
  await syncSignupMetadata(data.user, row ?? null);
  const firstLogin = !data.user.last_sign_in_at || data.user.last_sign_in_at === data.user.created_at;
  return { firstName, role: (row?.role as string) ?? "client", firstLogin };
}

/**
 * El registro cierra sesión hasta confirmar el correo, así que los datos extra
 * (domicilio desglosado, fecha de nacimiento, aceptación de TyC) viajan en el
 * user_metadata de Auth y se copian a `users` en el primer inicio de sesión.
 */
async function syncSignupMetadata(user: User, row: Row | null) {
  const um = (user.user_metadata ?? {}) as Row;
  const meta = (row?.metadata ?? {}) as Row;
  if (!um.address_parts || meta.address_parts) return;
  const parts = um.address_parts as AddressParts;
  const patch: Row = {
    address: um.address ?? formatAddress(parts),
    metadata: {
      ...meta,
      address_parts: parts,
      person_type: um.person_type ?? "fisica",
      terms_accepted_at: um.terms_accepted_at ?? null,
    },
  };
  if (um.birth_date) patch.birth_date = um.birth_date;
  if (um.terms_accepted_at) patch.terms_accepted = true;
  await supabase.from("users").update(patch).eq("id", user.id);
}

export function formatAddress(p: AddressParts | null | undefined) {
  if (!p) return "";
  return [
    [p.calle, p.numero].filter(Boolean).join(" "),
    p.interior ? `Int. ${p.interior}` : "",
    p.colonia,
    p.ciudad,
    p.estado,
    p.cp,
    p.pais && p.pais !== "México" ? p.pais : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCode: string;
  birthDate: string;
  address: AddressParts;
};

export async function signUp(input: SignUpInput): Promise<void> {
  if (IS_DEMO) {
    await wait(900);
    return;
  }
  const email = input.email.trim().toLowerCase();
  const { data: check, error: checkErr } = await supabase.functions.invoke("check-email", { body: { email } });
  if (checkErr) throw new ApiError("No pudimos verificar tu correo. Intenta de nuevo.");
  if (check?.exists === true) throw new ApiError("Este correo ya tiene una cuenta. Inicia sesión.", "exists");
  const now = new Date().toISOString();
  const { error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone,
        phone_country_code: input.phoneCode,
        birth_date: input.birthDate,
        address: formatAddress(input.address),
        address_parts: input.address,
        person_type: "fisica",
        terms_accepted_at: now,
      },
    },
  });
  if (error) throw new ApiError(authMessage(error.message));
  await supabase.auth.signOut().catch(() => undefined);
}

export async function requestPasswordReset(email: string) {
  if (IS_DEMO) return wait(600);
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new ApiError(authMessage(error.message));
}

export async function changePassword(email: string, current: string, next: string) {
  if (IS_DEMO) return wait(600);
  const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: current });
  if (e1) throw new ApiError("Tu contraseña actual no es correcta.");
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw new ApiError(authMessage(error.message));
}

/* ──────────────────────────────── Perfil ──────────────────────────────── */

const USER_COLS =
  "id, email, first_name, last_name, phone, phone_country_code, rfc, curp, ine_key, birth_date, address, avatar_url, code, created_at, ine_front_url, ine_back_url, curp_url, selfie_url, terms_accepted, metadata";

function deriveKyc(row: Row, meta: Row): Profile["kyc"] {
  const stored = meta.kyc as Profile["kyc"] | undefined;
  if (stored?.status) return stored;
  const has = !!row.ine_front_url && !!row.ine_back_url;
  return { status: has ? "por_verificar" : "incompleto" };
}

function mapProfile(row: Row): Profile {
  const meta = (row.metadata ?? {}) as Row;
  return {
    id: row.id,
    email: row.email ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    phoneCode: row.phone_country_code ?? "+52",
    rfc: row.rfc ?? "",
    curp: row.curp ?? "",
    ineKey: row.ine_key ?? "",
    birthDate: row.birth_date ?? "",
    address: row.address ?? "",
    addressParts: (meta.address_parts as AddressParts) ?? null,
    avatarUrl: row.avatar_url ?? null,
    code: row.code ?? null,
    createdAt: row.created_at,
    docs: {
      ineFront: row.ine_front_url ?? null,
      ineBack: row.ine_back_url ?? null,
      curp: row.curp_url ?? null,
      rfc: (meta.rfc_url as string) ?? null,
      addressProof: (meta.address_proof_url as string) ?? null,
    },
    kyc: deriveKyc(row, meta),
    loanEligible: meta.loan_eligible === true,
    termsAcceptedAt: (meta.terms_accepted_at as string) ?? (row.terms_accepted ? row.created_at : null),
    metadata: meta,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  if (IS_DEMO) {
    await wait(200);
    return structuredClone(demoState().profile);
  }
  const { data, error } = await supabase.from("users").select(USER_COLS).eq("id", userId).single();
  if (error) throw new ApiError("No pudimos cargar tu perfil.");
  return mapProfile(data);
}

export type ProfilePatch = Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  phoneCode: string;
  rfc: string;
  curp: string;
  birthDate: string;
  addressParts: AddressParts;
}>;

export async function updateProfile(userId: string, patch: ProfilePatch) {
  if (IS_DEMO) {
    await wait();
    const st = demoState();
    Object.assign(st.profile, patch);
    if (patch.addressParts) st.profile.address = formatAddress(patch.addressParts);
    saveDemo();
    return;
  }
  const up: Row = { updated_at: new Date().toISOString() };
  if (patch.firstName !== undefined) up.first_name = patch.firstName;
  if (patch.lastName !== undefined) up.last_name = patch.lastName;
  if (patch.phone !== undefined) up.phone = patch.phone;
  if (patch.phoneCode !== undefined) up.phone_country_code = patch.phoneCode;
  if (patch.rfc !== undefined) up.rfc = patch.rfc.toUpperCase();
  if (patch.curp !== undefined) up.curp = patch.curp.toUpperCase();
  if (patch.birthDate !== undefined) up.birth_date = patch.birthDate || null;
  if (patch.addressParts) {
    up.address = formatAddress(patch.addressParts);
    const { data } = await supabase.from("users").select("metadata").eq("id", userId).single();
    up.metadata = { ...((data?.metadata as Row) ?? {}), address_parts: patch.addressParts };
  }
  const { error } = await supabase.from("users").update(up).eq("id", userId);
  if (error) throw new ApiError("No pudimos guardar tus cambios.");
}

export async function acceptTerms(userId: string) {
  const at = new Date().toISOString();
  if (IS_DEMO) {
    await wait();
    demoState().profile.termsAcceptedAt = at;
    saveDemo();
    return;
  }
  const { data } = await supabase.from("users").select("metadata").eq("id", userId).single();
  const { error } = await supabase
    .from("users")
    .update({ terms_accepted: true, metadata: { ...((data?.metadata as Row) ?? {}), terms_accepted_at: at } })
    .eq("id", userId);
  if (error) throw new ApiError("No pudimos registrar tu aceptación. Intenta de nuevo.");
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (IS_DEMO) {
    await wait();
    const url = URL.createObjectURL(file);
    demoState().profile.avatarUrl = url;
    saveDemo();
    return url;
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `avatars/${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("user-documents").upload(path, file, { upsert: true });
  if (error) throw new ApiError("No pudimos subir la imagen.");
  const url = `${supabase.storage.from("user-documents").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
  return url;
}

/** Documentos que pide la verificación de identidad. CURP es opcional. */
export const REQUIRED_DOCS: DocKey[] = ["ineFront", "ineBack", "rfc", "addressProof"];

const DOC_COLUMN: Partial<Record<DocKey, string>> = { ineFront: "ine_front_url", ineBack: "ine_back_url", curp: "curp_url" };
const DOC_META: Partial<Record<DocKey, string>> = { rfc: "rfc_url", addressProof: "address_proof_url" };

/**
 * Sube o reemplaza un documento. Cuando ya están todos los obligatorios, la
 * identidad pasa a "por verificar" (también tras un rechazo: así el equipo ve
 * que el cliente volvió a cargar).
 */
export async function uploadDocument(userId: string, key: DocKey, file: File): Promise<KycStatus> {
  if (file.size > 8 * 1024 * 1024) throw new ApiError("El archivo no debe superar 8 MB.");
  if (IS_DEMO) {
    await wait(800);
    const st = demoState();
    st.profile.docs[key] = URL.createObjectURL(file);
    const complete = REQUIRED_DOCS.every((k) => !!st.profile.docs[k]);
    if (complete && (st.profile.kyc.status === "incompleto" || st.profile.kyc.status === "rechazado")) {
      st.profile.kyc = { status: "por_verificar" };
    }
    saveDemo();
    return st.profile.kyc.status;
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `kyc/${userId}/${key}_${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
  if (upErr) throw new ApiError("No pudimos subir el archivo. Intenta de nuevo.");
  const url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;

  const { data: row, error } = await supabase.from("users").select(USER_COLS).eq("id", userId).single();
  if (error) throw new ApiError("No pudimos guardar el documento.");
  const meta = { ...((row.metadata as Row) ?? {}) };
  const up: Row = {};
  if (DOC_COLUMN[key]) up[DOC_COLUMN[key] as string] = url;
  if (DOC_META[key]) meta[DOC_META[key] as string] = url;
  const next = mapProfile({ ...row, ...up, metadata: meta });
  const complete = REQUIRED_DOCS.every((k) => !!next.docs[k]);
  let status = next.kyc.status;
  if (complete && (status === "incompleto" || status === "rechazado")) {
    status = "por_verificar";
    meta.kyc = { status, submittedAt: new Date().toISOString() };
  }
  up.metadata = meta;
  const { error: e2 } = await supabase.from("users").update(up).eq("id", userId);
  if (e2) throw new ApiError("No pudimos guardar el documento.");
  return status;
}

/* ────────────────────────────── Membresías ────────────────────────────── */

function mapPlan(p: Row): Plan {
  const features = (p.features ?? {}) as Row;
  const benefits = Array.isArray(features.benefits) ? features.benefits : Array.isArray(p.features) ? p.features : [];
  const d = Number(p.duration_days ?? 365);
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: Number(p.price ?? 0),
    currency: p.currency ?? "MXN",
    durationDays: d,
    period: d >= 365 ? "Anual" : d >= 30 ? "Mensual" : `${d} días`,
    benefits,
    audience: (features.targetAudience as string) ?? "",
    interestRate: Number(features.interestRate ?? 0),
    highlighted: features.highlighted === true,
  };
}

export async function listPlans(): Promise<Plan[]> {
  if (IS_DEMO) {
    await wait(250);
    return DEMO_PLANS;
  }
  const { data, error } = await supabase.from("membership_plans").select("*").eq("active", true).order("price");
  if (error) throw new ApiError("No pudimos cargar las membresías.");
  return (data ?? []).map(mapPlan);
}

export async function getMembership(userId: string): Promise<UserMembership | null> {
  if (IS_DEMO) {
    await wait(200);
    return structuredClone(demoState().membership);
  }
  const { data } = await supabase
    .from("user_memberships")
    .select("*, membership_plans(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  const rows = data ?? [];
  const row = rows.find((r) => r.status === "active") ?? rows.find((r) => r.status === "pending") ?? rows[0];
  if (!row) return null;
  const plan = row.membership_plans ? mapPlan(row.membership_plans) : null;
  let status = row.status as UserMembership["status"];
  if (status === "active" && row.expires_at && new Date(row.expires_at) < new Date()) status = "expired";
  return {
    id: row.id,
    planId: row.membership_plan_id,
    planName: plan?.name ?? "Membresía",
    price: plan?.price ?? 0,
    status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    autoRenew: !!row.auto_renew,
    interestRate: plan?.interestRate ?? 0,
    benefits: plan?.benefits ?? [],
  };
}

export type Coupon = { code: string; discount: number; label: string };

export async function validateCoupon(code: string, price: number): Promise<Coupon> {
  const c = code.trim().toUpperCase();
  if (!c) throw new ApiError("Escribe un código.");
  if (IS_DEMO) {
    await wait();
    if (c === "BIENVENIDA") return { code: c, discount: Math.round(price * 0.2), label: "20% de descuento" };
    throw new ApiError("Este cupón no existe o ya venció.");
  }
  const { data, error } = await supabase.from("coupons").select("*").eq("code", c).maybeSingle();
  if (error || !data) throw new ApiError("Este cupón no existe o ya venció.");
  if (data.active === false) throw new ApiError("Este cupón ya no está activo.");
  if (data.expires_at && new Date(data.expires_at) < new Date()) throw new ApiError("Este cupón ya venció.");
  if (data.max_uses && Number(data.used_count ?? 0) >= Number(data.max_uses)) throw new ApiError("Este cupón ya alcanzó su límite de usos.");
  const type = String(data.discount_type ?? data.type ?? "percentage");
  const value = Number(data.discount_value ?? data.value ?? data.discount ?? 0);
  const discount = type.startsWith("percent") ? Math.round((price * value) / 100) : Math.min(price, value);
  return { code: c, discount, label: type.startsWith("percent") ? `${value}% de descuento` : `$${value} de descuento` };
}

export type CheckoutMethod = "card" | "link" | "spei" | "cash";

export type AcquireInput = {
  userId: string;
  plan: Plan;
  coupon?: Coupon | null;
  method: CheckoutMethod;
  invoice?: { rfc: string; fiscalAddress: string } | null;
  email?: string;
  name?: string;
};

export type AcquireResult =
  | { kind: "paid"; membership: UserMembership | null }
  | { kind: "reference"; method: Exclude<CheckoutMethod, "card">; reference: string; url?: string; expiresAt?: string; clabe?: string };

/**
 * Tarjeta: `/acquire-membership` (cobra la tarjeta predeterminada).
 * Link, SPEI y efectivo: `/membership-payment-reference` (pendiente en backend;
 * ver docs/CONTRATOS_BACKEND_CLIENTE.md).
 */
export async function acquireMembership(input: AcquireInput): Promise<AcquireResult> {
  const total = Math.max(0, input.plan.price - (input.coupon?.discount ?? 0));
  if (IS_DEMO) {
    await wait(1400);
    const st = demoState();
    if (input.method !== "card") {
      st.membership = {
        id: "um-demo",
        planId: input.plan.id,
        planName: input.plan.name,
        price: total,
        status: "pending",
        startedAt: new Date().toISOString(),
        expiresAt: null,
        autoRenew: false,
        interestRate: input.plan.interestRate,
        benefits: input.plan.benefits,
      };
      saveDemo();
      return {
        kind: "reference",
        method: input.method,
        reference: input.method === "cash" ? "9300 1234 5678 9012" : "INC-" + Math.floor(Math.random() * 900000 + 100000),
        clabe: input.method === "spei" ? "646180157000000004" : undefined,
        url: input.method === "link" ? "https://pay.conekta.com/link/demo" : undefined,
        expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      };
    }
    if (!st.paymentMethods.some((m) => m.type === "card")) throw new ApiError("Agrega una tarjeta para continuar.", "no_payment_method");
    st.membership = {
      id: "um-demo",
      planId: input.plan.id,
      planName: input.plan.name,
      price: total,
      status: "active",
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + input.plan.durationDays * 86400000).toISOString(),
      autoRenew: true,
      interestRate: input.plan.interestRate,
      benefits: input.plan.benefits,
    };
    const card = st.paymentMethods.find((m) => m.isDefault) ?? st.paymentMethods[0];
    st.movements.unshift({
      id: `mv-${Date.now()}`,
      kind: "membresia",
      title: `Membresía ${input.plan.name}`,
      subtitle: `Tarjeta •••• ${card?.last4 ?? "0000"}`,
      amount: total,
      direction: "out",
      status: "ok",
      statusLabel: "Pagado",
      date: new Date().toISOString(),
    });
    saveDemo();
    return { kind: "paid", membership: st.membership };
  }

  if (input.method !== "card") {
    const resp = await increscendoApiFetch("/membership-payment-reference", {
      method: "POST",
      body: JSON.stringify({
        user_id: input.userId,
        membership_plan_id: input.plan.id,
        method: input.method,
        coupon_code: input.coupon?.code,
        invoice: input.invoice ?? undefined,
      }),
    });
    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json?.ok) {
      throw new ApiError(
        resp.status === 404
          ? "Este método aún no está disponible. Paga con tarjeta por ahora."
          : json?.error || "No pudimos generar tu referencia de pago.",
      );
    }
    const d = json.data ?? json;
    return { kind: "reference", method: input.method, reference: d.reference, url: d.url, expiresAt: d.expires_at, clabe: d.clabe };
  }

  const resp = await increscendoApiFetch("/acquire-membership", {
    method: "POST",
    body: JSON.stringify({
      user_id: input.userId,
      membership_plan_id: input.plan.id,
      ...(input.coupon ? { coupon_code: input.coupon.code } : {}),
      ...(input.invoice ? { rfc: input.invoice.rfc, fiscal_address: input.invoice.fiscalAddress } : {}),
    }),
    timeout: 90000,
  });
  const json = await resp.json().catch(() => null);
  if (!json) throw new ApiError("Respuesta inválida del servidor. Intenta de nuevo.");
  if (!json.ok) {
    if (json.code === "no_payment_method" || json.code === "no_conekta_ref")
      throw new ApiError("Agrega una tarjeta para continuar.", "no_payment_method");
    throw new ApiError(json.error || "No pudimos procesar el pago.", json.code);
  }
  if (input.email) {
    const um = json.user_membership ?? null;
    void sendEmail({
      to: input.email,
      subject: "¡Membresía activada!",
      html: membershipAcquiredTemplate({
        name: input.name || "Cliente",
        planName: input.plan.name,
        amount: total.toLocaleString("es-MX"),
        startDate: um?.started_at ? new Date(um.started_at).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX"),
        expirationDate: um?.expires_at ? new Date(um.expires_at).toLocaleDateString("es-MX") : "—",
      }),
      text: `Hola ${input.name}, tu membresía ${input.plan.name} está activa.`,
    });
  }
  return { kind: "paid", membership: await getMembership(input.userId) };
}

/** Contrato de membresía por SignNow (pendiente en backend). */
export async function requestMembershipContract(userId: string, email: string, planId: string): Promise<"sent" | "unavailable"> {
  if (IS_DEMO) {
    await wait(700);
    return "sent";
  }
  try {
    const resp = await increscendoApiFetch("/signnow-membership-invite", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, recipient_email: email, membership_plan_id: planId }),
    });
    return resp.ok ? "sent" : "unavailable";
  } catch {
    return "unavailable";
  }
}

/* ─────────────────────────── Métodos de pago ─────────────────────────── */

export async function listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  if (IS_DEMO) {
    await wait(200);
    return structuredClone(demoState().paymentMethods);
  }
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new ApiError("No pudimos cargar tus métodos de pago.");
  return (data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    holderName: r.holder_name,
    isDefault: !!r.is_default,
    brand: r.card_type,
    last4: r.last_four ?? r.last_digits,
    expiry: r.expiry,
    token: r.token,
    bankName: r.bank_name,
    clabe: r.clabe,
    validation: r.validation_status,
  }));
}

/** Registra en Conekta una tarjeta ya tokenizada en el navegador. */
export async function addCard(userId: string, tokenId: string, preview: { last4: string; brand: string; holder: string; expiry: string }) {
  if (IS_DEMO) {
    await wait(900);
    const st = demoState();
    const first = !st.paymentMethods.some((m) => m.type === "card");
    st.paymentMethods.forEach((m) => {
      if (first && m.type === "card") m.isDefault = false;
    });
    st.paymentMethods.unshift({ id: `pm-${Date.now()}`, type: "card", holderName: preview.holder, isDefault: first, brand: preview.brand, last4: preview.last4, expiry: preview.expiry, token: tokenId });
    saveDemo();
    return;
  }
  const resp = await increscendoApiFetch("/add-card", { method: "POST", body: JSON.stringify({ supabase_id: userId, token_id: tokenId }) });
  const json = await resp.json().catch(() => null);
  if (!resp.ok || json?.ok !== true) throw new ApiError(json?.message || "No pudimos registrar la tarjeta.");
}

export async function addBankAccount(userId: string, bank: string, clabe: string, holder: string) {
  if (bank.toLowerCase().includes("santander") && clabe.startsWith("814"))
    throw new ApiError("El prefijo 814 no está permitido para Santander. Usa la CLABE con prefijo 014.");
  if (IS_DEMO) {
    await wait();
    const st = demoState();
    const pm: PaymentMethod = { id: `pm-${Date.now()}`, type: "bank", holderName: holder, isDefault: false, bankName: bank, clabe, validation: "pendiente" };
    st.paymentMethods.push(pm);
    saveDemo();
    return pm;
  }
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ user_id: userId, type: "bank", bank_name: bank, last_digits: clabe.slice(-4), clabe, holder_name: holder, validation_status: "pendiente" })
    .select()
    .single();
  if (error) throw new ApiError("No pudimos guardar la cuenta.");
  return { id: data.id, type: "bank", holderName: holder, isDefault: false, bankName: bank, clabe, validation: "pendiente" } as PaymentMethod;
}

export async function setDefaultCard(userId: string, method: PaymentMethod) {
  if (IS_DEMO) {
    await wait();
    demoState().paymentMethods.forEach((m) => {
      if (m.type === "card") m.isDefault = m.id === method.id;
    });
    saveDemo();
    return;
  }
  const resp = await increscendoApiFetch("/set-default-card", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, default_payment_source_id: method.token }),
  });
  if (!resp.ok) throw new ApiError("No pudimos cambiar tu tarjeta principal.");
}

export async function removePaymentMethod(id: string) {
  if (IS_DEMO) {
    await wait();
    const st = demoState();
    st.paymentMethods = st.paymentMethods.filter((m) => m.id !== id);
    saveDemo();
    return;
  }
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw new ApiError("No pudimos eliminar el método.");
}

const FALLBACK_BANKS: Bank[] = [
  "BBVA Bancomer",
  "Banamex",
  "Santander",
  "Banorte",
  "HSBC",
  "Scotiabank",
  "Inbursa",
  "Banco Azteca",
  "BanCoppel",
  "Banregio",
  "Afirme",
  "Nu México",
  "Mercado Pago",
].map((name) => ({ id: name, name }));

export async function listBanks(): Promise<Bank[]> {
  if (IS_DEMO) return FALLBACK_BANKS;
  try {
    const resp = await increscendoApiFetch("/belvo/institutions");
    const json = await resp.json();
    const rows = (json?.data ?? json?.results ?? json) as Row[];
    if (!Array.isArray(rows) || !rows.length) return FALLBACK_BANKS;
    return rows.map((r) => ({ id: String(r.id ?? r.name), name: String(r.display_name ?? r.name), code: r.code }));
  } catch {
    return FALLBACK_BANKS;
  }
}

export const isBancomer = (bank?: string | null) => /bbva|bancomer/i.test(bank ?? "");

/* ─────────────────────────────── Préstamos ─────────────────────────────── */

function mapLoan(r: Row): Loan {
  const meta = (r.metadata ?? {}) as Row;
  const disb = Array.isArray(r.loan_disbursements) ? r.loan_disbursements[0] : null;
  const rejection = meta.rejection as Row | undefined;
  return {
    id: r.id,
    number: r.loan_number ?? r.id.slice(0, 8).toUpperCase(),
    amount: Number(r.amount ?? 0),
    installments: Number(r.installments ?? 0),
    monthlyPayment: Number(r.monthly_payment ?? 0),
    interestRate: Number(r.interest_rate ?? 0),
    totalToPay: Number(r.total_to_pay ?? 0),
    status: (r.status === "closed" ? "paid" : r.status) as LoanStatus,
    appliedAt: r.applied_at ?? r.created_at,
    approvedAt: r.approved_at,
    signedAt: r.signed_at,
    disbursedAt: r.disbursed_at,
    bankName: disb?.destination_account?.bank ?? meta.depositData?.bank ?? null,
    clabe: disb?.destination_account?.clabe ?? meta.depositData?.clabe ?? null,
    rejectionMessage: (rejection?.message as string) ?? (meta.rejection_reason as string) ?? null,
    signUrl: (meta.sign_url as string) ?? (meta.signnow_link as string) ?? null,
    nextPaymentDate: (meta.next_payment_date as string) ?? null,
    paidAmount: Number(meta.paid_amount ?? 0),
  };
}

export async function listLoans(userId: string): Promise<Loan[]> {
  if (IS_DEMO) {
    await wait(250);
    return structuredClone(demoState().loans);
  }
  const { data, error } = await supabase
    .from("loans")
    .select("*, loan_disbursements(destination_account)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    const { data: plain, error: e2 } = await supabase.from("loans").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (e2) throw new ApiError("No pudimos cargar tus préstamos.");
    return (plain ?? []).map(mapLoan);
  }
  return (data ?? []).map(mapLoan);
}

export async function getInstallments(loan: Loan): Promise<Installment[]> {
  if (IS_DEMO) {
    await wait(300);
    return demoInstallments(loan);
  }
  const resp = await increscendoApiFetch(`/belvo/loans/${loan.id}/installments`);
  const json = await resp.json().catch(() => null);
  if (!json?.ok || !Array.isArray(json.data)) return [];
  return (json.data as Row[])
    .map((i) => ({
      number: Number(i.number),
      status: String(i.status ?? "pending"),
      amount: Number(i.amount ?? 0),
      dueDate: i.due_date ?? null,
      paymentRequestId: i.payment_request_id ?? null,
      failedReason: i.failed_reason_message ?? i.failed_reason ?? null,
    }))
    .sort((a, b) => a.number - b.number);
}

export const installmentPaid = (s: string) => ["paid", "completed", "successful"].includes(s.toLowerCase());
export const installmentProcessing = (s: string) => ["initial", "processing"].includes(s.toLowerCase());
export const installmentFailed = (s: string) => ["failed", "rejected", "error"].includes(s.toLowerCase());

/** Pago anticipado (cobro bajo demanda) de una o más cuotas. */
export async function payInstallments(loan: Loan, numbers: number[]) {
  if (IS_DEMO) {
    await wait(1200);
    const st = demoState();
    const l = st.loans.find((x) => x.id === loan.id);
    if (l) l.paidAmount += l.monthlyPayment * numbers.length;
    numbers.forEach((n) =>
      st.movements.unshift({
        id: `mv-${Date.now()}-${n}`,
        kind: "cuota",
        title: `Cuota ${n} de ${loan.installments}`,
        subtitle: `Préstamo ${loan.number}`,
        amount: loan.monthlyPayment,
        direction: "out",
        status: "pending",
        statusLabel: "En proceso",
        date: new Date().toISOString(),
      }),
    );
    saveDemo();
    return { partial: false };
  }
  const resp = await increscendoApiFetch(`/belvo/loans/${loan.id}/payment-request`, {
    method: "POST",
    body: JSON.stringify({ installmentNumbers: numbers }),
  });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new ApiError(json?.error || "No pudimos crear el cobro. Intenta más tarde.");
  return { partial: !!json?.partial, message: json?.message as string | undefined };
}

export type LoanRequestInput = {
  amount: number;
  installments: number;
  interestRate: number;
  monthlyPayment: number;
  totalToPay: number;
  account: { paymentMethodId?: string; bank: string; clabe: string; holder: string };
};

/** Crea la solicitud (mismo contrato que usaba LoanProcess: FormData a /belvo/loan-request). */
export async function createLoanRequest(profile: Profile, input: LoanRequestInput): Promise<Loan> {
  if (IS_DEMO) {
    await wait(1500);
    const st = demoState();
    const loan: Loan = {
      id: `loan-${Date.now()}`,
      number: `INC-2025-0${Math.floor(Math.random() * 900 + 100)}`,
      amount: input.amount,
      installments: input.installments,
      monthlyPayment: input.monthlyPayment,
      interestRate: input.interestRate,
      totalToPay: input.totalToPay,
      status: "under_review",
      appliedAt: new Date().toISOString(),
      approvedAt: null,
      signedAt: null,
      disbursedAt: null,
      bankName: input.account.bank,
      clabe: input.account.clabe,
      rejectionMessage: null,
      signUrl: null,
      nextPaymentDate: null,
      paidAmount: 0,
    };
    st.loans.unshift(loan);
    saveDemo();
    return loan;
  }
  const fd = new FormData();
  fd.append("user_id", profile.id);
  fd.append("amount", String(input.amount));
  fd.append("installments", String(input.installments));
  fd.append("monthly_payment", String(Number(input.monthlyPayment.toFixed(2))));
  fd.append("total_to_pay", String(Number(input.totalToPay.toFixed(2))));
  fd.append(
    "personalData",
    JSON.stringify({
      firstName: profile.firstName,
      lastName: profile.lastName,
      address: profile.address,
      birthDate: profile.birthDate,
      phone: profile.phone,
      rfc: profile.rfc,
      curp: profile.curp,
      ineKey: profile.ineKey,
    }),
  );
  fd.append("depositData", JSON.stringify({ bank: input.account.bank, clabe: input.account.clabe, holder_name: input.account.holder }));
  if (input.account.paymentMethodId) fd.append("paymentMethodId", input.account.paymentMethodId);
  const resp = await increscendoApiFetch("/belvo/loan-request", { method: "POST", body: fd, timeout: 60000 });
  const json = await resp.json().catch(() => null);
  if (!resp.ok || !json?.success) throw new ApiError(json?.message || json?.error || "No pudimos enviar tu solicitud.");
  return mapLoan(json.loan);
}

/** El cliente confirma que firmó el contrato enviado por SignNow. */
export async function confirmLoanSigned(loanId: string) {
  if (IS_DEMO) {
    await wait(800);
    const l = demoState().loans.find((x) => x.id === loanId);
    if (l) {
      l.status = "signed";
      l.signedAt = new Date().toISOString();
    }
    saveDemo();
    return;
  }
  const { data, error } = await supabase.rpc("user_sign_loan", { p_loan_id: loanId });
  if (error || (data as Row)?.error) throw new ApiError("No pudimos registrar la firma. Intenta de nuevo.");
}

/** Solo demostración: avanza el préstamo para ver cada estado. */
export function demoAdvanceLoan(loanId: string) {
  const l = demoState().loans.find((x) => x.id === loanId);
  if (!l) return;
  const order: LoanStatus[] = ["under_review", "approved", "signed", "disbursed", "active"];
  const i = order.indexOf(l.status);
  if (i >= 0 && i < order.length - 1) {
    l.status = order[i + 1];
    if (l.status === "approved") l.approvedAt = new Date().toISOString();
    if (l.status === "disbursed") l.disbursedAt = new Date().toISOString();
    if (l.status === "active") l.nextPaymentDate = new Date(Date.now() + 30 * 86400000).toISOString();
  }
  saveDemo();
}

/* ────────────────────────────── Movimientos ────────────────────────────── */

const PR_STATUS: Record<string, { s: Movement["status"]; l: string }> = {
  paid: { s: "ok", l: "Cobrado" },
  completed: { s: "ok", l: "Cobrado" },
  successful: { s: "ok", l: "Cobrado" },
  initial: { s: "pending", l: "En proceso" },
  processing: { s: "pending", l: "En proceso" },
  pending: { s: "pending", l: "Pendiente" },
  failed: { s: "failed", l: "Fallido" },
  rejected: { s: "failed", l: "Rechazado" },
};
const INV_STATUS: Record<string, { s: Movement["status"]; l: string }> = {
  paid: { s: "ok", l: "Pagado" },
  pending: { s: "pending", l: "Pendiente" },
  failed: { s: "failed", l: "Fallido" },
  canceled: { s: "failed", l: "Cancelado" },
};

export async function listMovements(userId: string): Promise<Movement[]> {
  if (IS_DEMO) {
    await wait(300);
    return structuredClone(demoState().movements);
  }
  const out: Movement[] = [];
  const [inv, disb] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("loan_disbursements").select("*, loans!inner(user_id, loan_number)").eq("loans.user_id", userId).limit(50),
  ]);
  for (const r of inv.data ?? []) {
    const st = INV_STATUS[String(r.status)] ?? { s: "pending", l: String(r.status) };
    out.push({
      id: `inv-${r.id}`,
      kind: "membresia",
      title: (r.metadata?.description as string) ?? "Pago de membresía",
      subtitle: r.payment_provider === "conekta" ? "Conekta" : (r.payment_provider ?? "Pago"),
      amount: Number(r.amount ?? 0) - Number(r.discount_amount ?? 0),
      direction: "out",
      status: st.s,
      statusLabel: st.l,
      date: r.created_at,
      reference: r.provider_payment_id,
    });
  }
  for (const r of disb.data ?? []) {
    out.push({
      id: `disb-${r.id}`,
      kind: "prestamo",
      title: "Desembolso de préstamo",
      subtitle: `Préstamo ${r.loans?.loan_number ?? ""}`.trim(),
      amount: Number(r.amount ?? 0),
      direction: "in",
      status: r.status === "failed" ? "failed" : r.status === "completed" || r.status === "paid" || !r.status ? "ok" : "pending",
      statusLabel: r.status === "failed" ? "Fallido" : "Depositado",
      date: r.disbursed_at ?? r.created_at,
    });
  }
  try {
    const resp = await increscendoApiFetch(`/belvo/loans/payment-requests?userId=${userId}&page=1&limit=50`);
    const json = await resp.json().catch(() => null);
    for (const r of (json?.data ?? []) as Row[]) {
      const raw = String(r.status ?? r.belvo_status ?? "initial").toLowerCase();
      const st = PR_STATUS[raw] ?? { s: "pending", l: raw };
      const n = r.installment_number ?? r.raw?.loan_information?.installmentNumber;
      out.push({
        id: `pr-${r.payment_request_id ?? r.reference}`,
        kind: "cuota",
        title: n ? `Cuota ${n}` : "Cuota de préstamo",
        subtitle: `Préstamo ${r.loan_number ?? ""}`.trim(),
        amount: Number(r.amount ?? 0),
        direction: "out",
        status: st.s,
        statusLabel: st.l,
        date: r.created_at ?? r.synced_at ?? new Date().toISOString(),
        reference: r.reference,
      });
    }
  } catch {
    /* las cuotas se omiten si la API no responde */
  }
  if (!(inv.data ?? []).length) {
    const { data: ums } = await supabase
      .from("user_memberships")
      .select("id, status, created_at, started_at, membership_plans(name, price)")
      .eq("user_id", userId);
    for (const m of (ums ?? []) as Row[]) {
      out.push({
        id: `um-${m.id}`,
        kind: "membresia",
        title: `Membresía ${m.membership_plans?.name ?? ""}`.trim(),
        subtitle: "Membresía",
        amount: Number(m.membership_plans?.price ?? 0),
        direction: "out",
        status: m.status === "pending" ? "pending" : "ok",
        statusLabel: m.status === "pending" ? "Pendiente" : "Pagado",
        date: m.started_at ?? m.created_at,
      });
    }
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/* ──────────────────────────── Notificaciones ──────────────────────────── */

export async function listNotifications(userId: string): Promise<Notification[]> {
  if (IS_DEMO) {
    await wait(200);
    return structuredClone(demoState().notifications);
  }
  const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  return (data ?? []).map((n) => ({ id: n.id, type: n.type, title: n.title, message: n.message, url: n.url, read: !!n.read, createdAt: n.created_at }));
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  if (IS_DEMO) {
    demoState().notifications.forEach((n) => {
      if (!ids || ids.includes(n.id)) n.read = true;
    });
    saveDemo();
    return;
  }
  let q = supabase.from("notifications").update({ read: true }).eq("user_id", userId);
  if (ids) q = q.in("id", ids);
  await q;
}

/* ─────────────────────────── Servicios (Tekae) ─────────────────────────── */

export async function getServicesUrl(): Promise<string> {
  if (IS_DEMO) {
    await wait(900);
    return "about:blank";
  }
  const resp = await increscendoApiFetch("/tekae-token", { method: "POST" });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new ApiError(json?.message || "No pudimos abrir Servicios. Intenta de nuevo.");
  const url = (json?.data ?? json)?.finalUrl;
  if (!url) throw new ApiError("No pudimos abrir Servicios. Intenta de nuevo.");
  return url;
}

/* ───────────────────────── Tarjeta (Fase 2, OneCard) ───────────────────────── */

export async function getCardState(): Promise<CardState> {
  if (IS_DEMO) {
    await wait(200);
    return structuredClone(demoState().card);
  }
  try {
    const resp = await increscendoApiFetch("/onecard/me");
    if (!resp.ok) return { status: "none" };
    const json = await resp.json();
    return (json?.data ?? json) as CardState;
  } catch {
    return { status: "none" };
  }
}

export async function requestCard(kind: "fisica" | "digital", holder: string, address?: AddressParts) {
  if (IS_DEMO) {
    await wait(1200);
    const st = demoState();
    st.card = { status: "requested", kind, holder, requestedAt: new Date().toISOString() };
    saveDemo();
    return;
  }
  const resp = await increscendoApiFetch("/onecard/requests", { method: "POST", body: JSON.stringify({ kind, holder, address }) });
  if (!resp.ok) throw new ApiError("No pudimos enviar tu solicitud. Intenta más tarde.");
}

export function demoActivateCard() {
  const st = demoState();
  st.card = {
    status: "active",
    kind: st.card.kind ?? "digital",
    holder: st.card.holder ?? `${st.profile.firstName} ${st.profile.lastName}`,
    last4: "7731",
    expiry: "10/29",
    balance: 3500,
    creditLine: 5000,
    onlinePurchases: true,
    movements: [
      { id: "c1", title: "Recarga de saldo", amount: 3500, date: new Date().toISOString(), direction: "in" },
      { id: "c2", title: "Oxxo Insurgentes", amount: 86, date: new Date(Date.now() - 86400000).toISOString(), direction: "out" },
    ],
  };
  saveDemo();
}

export async function updateCard(patch: { onlinePurchases?: boolean; blocked?: boolean }) {
  if (IS_DEMO) {
    await wait();
    const c = demoState().card;
    if (patch.onlinePurchases !== undefined) c.onlinePurchases = patch.onlinePurchases;
    if (patch.blocked !== undefined) c.status = patch.blocked ? "blocked" : "active";
    saveDemo();
    return;
  }
  const resp = await increscendoApiFetch("/onecard/me", { method: "PATCH", body: JSON.stringify(patch) });
  if (!resp.ok) throw new ApiError("No pudimos actualizar tu tarjeta.");
}
