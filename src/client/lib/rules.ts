import type { KycStatus, LoanStatus, Profile, UserMembership } from "./types";
import { REQUIRED_DOCS } from "./api";
import { LOANS_MODE } from "./env";

/**
 * Reglas de negocio del cliente (acordadas con Héctor):
 * - La membresía se compra después del registro (sin fricción para entrar).
 * - Para comprar membresía hay que SUBIR la identidad; no hace falta que esté aprobada.
 * - Tarjeta: identidad verificada + membresía activa.
 * - Préstamo: visible para todos (LOANS_MODE='all') o solo invitados; requiere identidad verificada + membresía activa.
 */
export function journey(profile?: Profile | null, membership?: UserMembership | null) {
  const kyc: KycStatus = profile?.kyc.status ?? "incompleto";
  const docsUploaded = !!profile && REQUIRED_DOCS.every((k) => !!profile.docs[k]);
  const docsCount = profile ? REQUIRED_DOCS.filter((k) => !!profile.docs[k]).length : 0;
  const hasMembership = membership?.status === "active";
  const membershipPending = membership?.status === "pending";
  const verified = kyc === "verificado";
  return {
    kyc,
    docsUploaded,
    docsCount,
    docsTotal: REQUIRED_DOCS.length,
    verified,
    hasMembership,
    membershipPending,
    canBuyMembership: docsUploaded || kyc === "por_verificar" || verified,
    canRequestCard: verified && hasMembership,
    /** Si el módulo de préstamos se muestra (LOANS_MODE). */
    loanInvited: LOANS_MODE === "all" || !!profile?.loanEligible,
    /** Preaprobado por el admin (metadata.loan_eligible). */
    loanPreapproved: !!profile?.loanEligible,
    canRequestLoan: (LOANS_MODE === "all" || !!profile?.loanEligible) && verified && hasMembership,
    onboardingDone: (verified || kyc === "por_verificar") && hasMembership,
  };
}

export const KYC_COPY: Record<KycStatus, { label: string; tone: Tone; help: string }> = {
  incompleto: { label: "Pendiente", tone: "warning", help: "Sube tu INE, RFC y comprobante de domicilio." },
  por_verificar: { label: "En revisión", tone: "info", help: "Estamos revisando tus documentos. Te avisaremos por correo." },
  verificado: { label: "Verificada", tone: "success", help: "Tu identidad está verificada." },
  rechazado: { label: "Requiere cambios", tone: "danger", help: "Uno o más documentos necesitan corrección." },
};

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export const LOAN_COPY: Record<LoanStatus, { label: string; tone: Tone }> = {
  pending: { label: "Recibida", tone: "info" },
  under_review: { label: "En revisión", tone: "info" },
  approved: { label: "Aprobado · firma pendiente", tone: "warning" },
  signed: { label: "Firmado", tone: "brand" },
  disbursed: { label: "Depositado", tone: "success" },
  active: { label: "Activo", tone: "success" },
  paid: { label: "Liquidado", tone: "neutral" },
  rejected: { label: "No aprobado", tone: "danger" },
  cancelled: { label: "No aprobado", tone: "danger" },
};

export const isOpenLoan = (s: LoanStatus) => ["pending", "under_review", "approved", "signed", "disbursed", "active"].includes(s);
export const isInProcess = (s: LoanStatus) => ["pending", "under_review", "approved", "signed"].includes(s);
