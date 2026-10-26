export type KycStatus = "incompleto" | "por_verificar" | "verificado" | "rechazado";

export type AddressParts = {
  calle: string;
  numero: string;
  interior?: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string;
  pais?: string;
};

export type DocKey = "ineFront" | "ineBack" | "rfc" | "addressProof" | "curp";

export type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCode: string;
  rfc: string;
  curp: string;
  ineKey: string;
  birthDate: string;
  address: string;
  addressParts: AddressParts | null;
  avatarUrl: string | null;
  code: string | null;
  createdAt: string;
  docs: Record<DocKey, string | null>;
  kyc: { status: KycStatus; reasonMessage?: string | null; reasonCode?: string | null; reviewedAt?: string | null };
  /** Préstamo por invitación (metadata.loan_eligible). */
  loanEligible: boolean;
  termsAcceptedAt: string | null;
  metadata: Record<string, unknown>;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  period: string;
  benefits: string[];
  audience: string;
  interestRate: number;
  highlighted?: boolean;
};

export type MembershipStatus = "active" | "pending" | "expired" | "canceled";

export type UserMembership = {
  id: string;
  planId: string | null;
  planName: string;
  price: number;
  status: MembershipStatus;
  startedAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  interestRate: number;
  benefits: string[];
};

export type PaymentMethod = {
  id: string;
  type: "card" | "bank";
  holderName: string;
  isDefault: boolean;
  brand?: string | null;
  last4?: string | null;
  expiry?: string | null;
  token?: string | null;
  bankName?: string | null;
  clabe?: string | null;
  validation?: "validada" | "pendiente" | null;
};

export type LoanStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "signed"
  | "disbursed"
  | "active"
  | "paid"
  | "rejected"
  | "cancelled";

export type Loan = {
  id: string;
  number: string;
  amount: number;
  installments: number;
  monthlyPayment: number;
  interestRate: number;
  totalToPay: number;
  status: LoanStatus;
  appliedAt: string;
  approvedAt: string | null;
  signedAt: string | null;
  disbursedAt: string | null;
  bankName: string | null;
  clabe: string | null;
  rejectionMessage: string | null;
  signUrl: string | null;
  nextPaymentDate: string | null;
  paidAmount: number;
};

export type Installment = {
  number: number;
  status: string;
  amount: number;
  dueDate: string | null;
  paymentRequestId: string | null;
  failedReason: string | null;
};

export type MovementKind = "membresia" | "prestamo" | "cuota" | "servicio" | "tarjeta";

export type Movement = {
  id: string;
  kind: MovementKind;
  title: string;
  subtitle: string;
  amount: number;
  direction: "in" | "out";
  status: "ok" | "pending" | "failed";
  statusLabel: string;
  date: string;
  reference?: string | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export type Bank = { id: string; name: string; code?: string };

export type CardState = {
  /** none: sin invitación · invited: tiene link · requested · active · blocked */
  status: "none" | "invited" | "requested" | "active" | "blocked";
  kind?: "fisica" | "digital";
  last4?: string;
  balance?: number;
  creditLine?: number;
  holder?: string;
  expiry?: string;
  onlinePurchases?: boolean;
  movements?: { id: string; title: string; amount: number; date: string; direction: "in" | "out" }[];
  requestedAt?: string;
};
