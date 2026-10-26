/**
 * Datos de demostración del área de clientes. Solo se usan cuando IS_DEMO es
 * true. El estado se guarda en sessionStorage para que las acciones (subir un
 * documento, comprar una membresía, solicitar un préstamo) persistan al
 * recargar mientras dura la sesión del navegador.
 */
import type { CardState, Loan, Movement, Notification, PaymentMethod, Plan, Profile, UserMembership } from "./types";

const KEY = "increscendo_demo_state_v1";
export const DEMO_AUTH_KEY = "increscendo_demo_auth";

export type DemoScenario = "nuevo" | "miembro" | "invitado";

export type DemoState = {
  scenario: DemoScenario;
  profile: Profile;
  membership: UserMembership | null;
  paymentMethods: PaymentMethod[];
  loans: Loan[];
  movements: Movement[];
  notifications: Notification[];
  card: CardState;
};

const iso = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 86400000).toISOString();

export const DEMO_PLANS: Plan[] = [
  {
    id: "plan-esencial",
    name: "Esencial",
    description: "Para empezar a ahorrar en tus pagos del día a día.",
    price: 100,
    currency: "MXN",
    durationDays: 365,
    period: "Anual",
    audience: "Personas físicas",
    interestRate: 42,
    benefits: ["Pago de servicios y recargas sin comisión", "Descuentos con comercios aliados", "Soporte por chat"],
  },
  {
    id: "plan-premier",
    name: "Premier",
    description: "Más beneficios y acceso prioritario a nuevos productos.",
    price: 1200,
    currency: "MXN",
    durationDays: 365,
    period: "Anual",
    audience: "Personas físicas",
    interestRate: 36,
    highlighted: true,
    benefits: [
      "Todo lo de Esencial",
      "Acceso prioritario a la tarjeta Increscendo",
      "Promociones exclusivas cada mes",
      "Atención preferente",
    ],
  },
  {
    id: "plan-empresarial",
    name: "Empresarial",
    description: "Para empresas y personas morales.",
    price: 5000,
    currency: "MXN",
    durationDays: 365,
    period: "Anual",
    audience: "Personas morales",
    interestRate: 32,
    benefits: ["Todo lo de Premier", "Gestor dedicado", "Facturación mensual consolidada"],
  },
];

const baseProfile = (): Profile => ({
  id: "demo-user",
  email: "mariana.lopez@correo.mx",
  firstName: "Mariana",
  lastName: "López Herrera",
  phone: "5512345678",
  phoneCode: "+52",
  rfc: "LOHM900215AB3",
  curp: "",
  ineKey: "",
  birthDate: "1990-02-15",
  address: "Av. Insurgentes Sur 1234, Int. 5, Del Valle, Benito Juárez, CDMX, 03100",
  addressParts: {
    calle: "Av. Insurgentes Sur",
    numero: "1234",
    interior: "5",
    colonia: "Del Valle",
    ciudad: "Benito Juárez",
    estado: "Ciudad de México",
    cp: "03100",
  },
  avatarUrl: null,
  code: "INC-004182",
  createdAt: iso(-40),
  docs: { ineFront: null, ineBack: null, rfc: null, addressProof: null, curp: null },
  kyc: { status: "incompleto" },
  loanEligible: false,
  termsAcceptedAt: iso(-40),
  metadata: {},
});

const DEMO_IMG = "/placeholder.svg";

export function buildScenario(scenario: DemoScenario): DemoState {
  const profile = baseProfile();
  const notifications: Notification[] = [
    {
      id: "n1",
      type: "welcome",
      title: "¡Bienvenida a Increscendo!",
      message: "Completa tu identidad y elige tu membresía para activar todos tus beneficios.",
      url: "/dashboard",
      read: scenario !== "nuevo",
      createdAt: iso(-40),
    },
  ];
  const state: DemoState = {
    scenario,
    profile,
    membership: null,
    paymentMethods: [],
    loans: [],
    movements: [],
    notifications,
    card: { status: "none" },
  };
  if (scenario === "nuevo") return state;

  profile.docs = { ineFront: DEMO_IMG, ineBack: DEMO_IMG, rfc: DEMO_IMG, addressProof: DEMO_IMG, curp: null };
  profile.kyc = { status: "verificado", reviewedAt: iso(-30) };
  const plan = DEMO_PLANS[1];
  state.membership = {
    id: "um-1",
    planId: plan.id,
    planName: plan.name,
    price: plan.price,
    status: "active",
    startedAt: iso(-30),
    expiresAt: iso(335),
    autoRenew: true,
    interestRate: plan.interestRate,
    benefits: plan.benefits,
  };
  state.paymentMethods = [
    { id: "pm-1", type: "card", holderName: "Mariana López", isDefault: true, brand: "visa", last4: "4242", expiry: "08/28", token: "src_demo" },
  ];
  state.movements = [
    {
      id: "mv-1",
      kind: "membresia",
      title: "Membresía Premier",
      subtitle: "Tarjeta •••• 4242",
      amount: plan.price,
      direction: "out",
      status: "ok",
      statusLabel: "Pagado",
      date: iso(-30),
      reference: "ord_2tQ8x",
    },
    {
      id: "mv-2",
      kind: "servicio",
      title: "Recarga Telcel",
      subtitle: "Servicios y recargas",
      amount: 150,
      direction: "out",
      status: "ok",
      statusLabel: "Pagado",
      date: iso(-6),
    },
    {
      id: "mv-3",
      kind: "servicio",
      title: "Pago CFE",
      subtitle: "Servicios y recargas",
      amount: 486.5,
      direction: "out",
      status: "ok",
      statusLabel: "Pagado",
      date: iso(-3),
    },
  ];
  notifications.unshift({
    id: "n2",
    type: "kyc",
    title: "Identidad verificada",
    message: "Revisamos tus documentos y todo está en orden.",
    url: "/identidad",
    read: true,
    createdAt: iso(-30),
  });
  state.card = { status: "invited" };

  if (scenario === "invitado") {
    profile.loanEligible = true;
    state.paymentMethods.push({
      id: "pm-2",
      type: "bank",
      holderName: "Mariana López Herrera",
      isDefault: false,
      bankName: "BBVA Bancomer",
      clabe: "012180015555555551",
      validation: "validada",
    });
    state.loans = [
      {
        id: "loan-1",
        number: "INC-2025-0142",
        amount: 25000,
        installments: 12,
        monthlyPayment: 2511.47,
        interestRate: 36,
        totalToPay: 30137.64,
        status: "active",
        appliedAt: iso(-75),
        approvedAt: iso(-73),
        signedAt: iso(-72),
        disbursedAt: iso(-70),
        bankName: "BBVA Bancomer",
        clabe: "012180015555555551",
        rejectionMessage: null,
        signUrl: null,
        nextPaymentDate: iso(9),
        paidAmount: 5022.94,
      },
    ];
    state.movements.unshift(
      {
        id: "mv-4",
        kind: "cuota",
        title: "Cuota 2 de 12",
        subtitle: "Préstamo INC-2025-0142",
        amount: 2511.47,
        direction: "out",
        status: "ok",
        statusLabel: "Cobrado",
        date: iso(-10),
      },
      {
        id: "mv-5",
        kind: "cuota",
        title: "Cuota 1 de 12",
        subtitle: "Préstamo INC-2025-0142",
        amount: 2511.47,
        direction: "out",
        status: "ok",
        statusLabel: "Cobrado",
        date: iso(-40),
      },
      {
        id: "mv-6",
        kind: "prestamo",
        title: "Desembolso de préstamo",
        subtitle: "BBVA •••• 5551",
        amount: 25000,
        direction: "in",
        status: "ok",
        statusLabel: "Depositado",
        date: iso(-70),
      },
    );
    notifications.unshift({
      id: "n3",
      type: "payment",
      title: "Tu próxima cuota vence pronto",
      message: "La cuota 3 de tu préstamo se cobrará en 9 días.",
      url: "/my-loans",
      read: false,
      createdAt: iso(-1),
    });
  }
  state.movements.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return state;
}

let cache: DemoState | null = null;

export function demoState(): DemoState {
  if (!cache) {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) cache = JSON.parse(raw) as DemoState;
    } catch {
      /* sin storage */
    }
  }
  // ?demo=nuevo|miembro|invitado cambia el escenario (útil para probar cada caso).
  try {
    const q = new URLSearchParams(window.location.search).get("demo") as DemoScenario | null;
    if (q && ["nuevo", "miembro", "invitado"].includes(q) && cache?.scenario !== q) {
      cache = buildScenario(q);
      saveDemo();
    }
  } catch {
    /* noop */
  }
  if (!cache) cache = buildScenario("miembro");
  return cache;
}

export function saveDemo(next?: DemoState) {
  if (next) cache = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* sin storage */
  }
}

export function setDemoScenario(s: DemoScenario) {
  saveDemo(buildScenario(s));
}

export const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

export function demoInstallments(loan: Loan) {
  const paid = Math.round(loan.paidAmount / loan.monthlyPayment);
  const start = new Date(loan.disbursedAt ?? loan.appliedAt);
  return Array.from({ length: loan.installments }).map((_, i) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i + 1);
    return {
      number: i + 1,
      status: i < paid ? "paid" : "pending",
      amount: loan.monthlyPayment,
      dueDate: due.toISOString(),
      paymentRequestId: i < paid ? `pr_${i + 1}` : null,
      failedReason: null,
    };
  });
}
