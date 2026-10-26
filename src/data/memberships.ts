export interface Membership {
  id: string;
  title: string;
  cost: number;
  currency: string;
  targetAudience: string;
  interestRate: number;
  renewalPeriod: string;
  benefits: string[];
  isActive: boolean;
}

export interface UserMembership {
  id: string;
  membershipId: string;
  membershipTitle: string;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  expirationDate: string;
  autoRenewal: boolean;
}

export interface PaymentHistory {
  id: string;
  date: string;
  concept: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

export const defaultMemberships: Membership[] = [
  {
    id: 'premier',
    title: 'Membresía Premier',
    cost: 100,
    currency: 'MXN',
    targetAudience: 'Persona Natural',
    interestRate: 42,
    renewalPeriod: 'Anual',
    benefits: ['Descuentos exclusivos', 'Promociones especiales', 'Acceso prioritario'],
    isActive: true
  },
  {
    id: 'gold',
    title: 'Membresía Gold',
    cost: 5000,
    currency: 'MXN',
    targetAudience: 'Empresas/Jurídicas',
    interestRate: 42,
    renewalPeriod: 'Anual',
    benefits: ['Atención preferencial 24/7', 'Descuentos empresariales', 'Gestor personal dedicado', 'Línea de crédito especial'],
    isActive: true
  }
];

// Mock user membership data (simulates having an active membership)
export const mockUserMembership: UserMembership | null = null; // Change to object to simulate active membership

export const mockPaymentHistory: PaymentHistory[] = [
  {
    id: '1',
    date: '2024-01-15',
    concept: 'Renovación Membresía Gold',
    amount: 5000,
    status: 'paid'
  },
  {
    id: '2',
    date: '2023-01-15',
    concept: 'Adquisición Membresía Gold',
    amount: 5000,
    status: 'paid'
  }
];

// Example of active membership (for testing Scenario B)
export const mockActiveMembership: UserMembership = {
  id: 'user-mem-1',
  membershipId: 'gold',
  membershipTitle: 'Membresía Gold',
  status: 'active',
  startDate: '2024-01-15',
  expirationDate: '2025-01-15',
  autoRenewal: true
};
