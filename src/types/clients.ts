export interface Client {
  id: string;
  code: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  registrationDate: string;
  ine: string;
  curp: string;
  membership: string;
  membershipStatus: string;
  totalLoans: number;
  activeLoans: number;
  photoUrl?: string;
  ineFrontUrl?: string;
  ineBackUrl?: string;
  curpUrl?: string;
}

export interface ClientMembership {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  ine: string;
  membershipType: string;
  activationDate: string;
  expirationDate: string;
  renewalCount: number;
  status: string;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

export interface ClientColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}
