export interface LoanBase {
  id: string;
  user_id?: string;
  firstName: string;
  lastName: string;
  requestDate: string;
  amount: number;
  installments: number;
  membership: string;
  ineNumber: string;
  curpNumber: string;
}

export interface PendingLoan extends LoanBase {
  preApproval: 'En Revisión' | 'Aprobado' | 'Rechazado';
  ineFront?: string;
  ineBack?: string;
  curpPdf?: string;
  isAccountVerified: boolean;
}

export interface ContractLoan extends LoanBase {
  preApproval: 'Aprobado';
  signatureStatus: 'Error' | 'Espera' | 'Firmado';
  address?: string;
  birthDate?: string;
  phone?: string;
  bank?: string;
  accountNumber?: string;
}

export interface DisbursementLoan extends LoanBase {
  contractStatus: 'Firmado';
  disbursementStatus: 'Pendiente' | 'Completado';
  bank: string;
  accountNumber: string;
}

export interface ActiveLoan extends LoanBase {
  paidInstallments: number;
  lastPaymentDate: string;
  status: 'Al día';
}

export interface OverdueLoan extends LoanBase {
  paidInstallments: number;
  lastPaymentDate: string;
  status: 'Atrasado' | 'Urgente';
  email?: string;
}

export interface HistoryLoan extends LoanBase {
  paidInstallments: number;
  lastPaymentDate: string;
  status: 'Liquidado' | 'Cartera Vendida';
}

export type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
};
