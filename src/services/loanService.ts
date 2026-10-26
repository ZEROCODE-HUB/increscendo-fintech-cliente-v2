import { supabase } from '@/lib/supabase';
import { increscendoApiFetch } from '@/lib/increscendoApi';
import type { User } from '@/types/users';

export interface Loan {
  id: string;
  user_id: string;
  loan_number?: string;
  amount: number;
  installments: number;
  monthly_payment: number;
  interest_rate: number;
  total_to_pay: number;
  status: LoanStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  approved_at?: string;
  signed_at?: string;
  disbursed_at?: string;
}

export type LoanStatus = 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'signed' 
  | 'disbursed' 
  | 'active' 
  | 'paid' 
  | 'cancelled' 
  | 'rejected' 
  | 'closed';

export interface CreateLoanPayload {
  amount: number;
  installments: number;
  monthly_payment: number;
  interest_rate: number;
  total_to_pay: number;
  paymentMethodId?: string;
  personalData: {
    firstName: string;
    lastName: string;
    curp: string;
    ineKey: string;
  };
  depositData: {
    bank: string;
    clabe: string;
  };
  disbursementData?: {
    bank: string;
    clabe: string;
  };
}

export const loanService = {
  async getByUser(userId: string): Promise<Loan[]> {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Loan | null> {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload: CreateLoanPayload): Promise<{ loan: Loan; success: boolean }> {
    const response = await increscendoApiFetch('/belvo/loan-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create loan');
    }

    return result;
  },

  async updateStatus(id: string, status: LoanStatus): Promise<void> {
    const updates: Partial<Loan> = { status };
    
    if (status === 'signed') {
      updates.signed_at = new Date().toISOString();
    } else if (status === 'disbursed') {
      updates.disbursed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getAll(filters?: { status?: LoanStatus; limit?: number }): Promise<Loan[]> {
    let query = supabase.from('loans').select('*').order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAdminLoans(params: {
    status: LoanStatus[];
    page: number;
    pageSize: number;
  }): Promise<{ loans: Loan[]; total: number }> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let query = supabase
      .from('loans')
      .select('id, loan_number, amount, installments, monthly_payment, interest_rate, total_to_pay, status, status_consent, applied_at, created_at, approved_at, signed_at, disbursed_at, metadata, user_id, users(first_name,last_name,ine_key,curp,phone,email,user_memberships(membership_plan_id,membership_plans(id,name,features)))', { count: 'exact' })
      .in('status', params.status)
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { loans: data || [], total: count || 0 };
  },

  async getOverdueLoans(): Promise<Loan[]> {
    const { data, error } = await supabase
      .from('loans')
      .select('id, loan_number, amount, installments, monthly_payment, interest_rate, total_to_pay, status, status_consent, applied_at, created_at, approved_at, signed_at, disbursed_at, metadata, user_id, users(first_name,last_name,ine_key,curp,phone,email,user_memberships(membership_plan_id,membership_plans(id,name,features))), loan_signatures(*), loan_disbursements(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};