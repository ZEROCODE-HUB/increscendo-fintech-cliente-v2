import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanService, type Loan, type CreateLoanPayload, type LoanStatus } from '@/services/loanService';

export const LOAN_KEYS = {
  all: ['loans'] as const,
  byUser: (userId: string) => ['loans', 'user', userId] as const,
  byId: (id: string) => ['loans', 'id', id] as const,
  allAdmin: (filters?: { status?: LoanStatus }) => ['loans', 'admin', filters] as const,
  adminPending: (page: number) => ['loans', 'admin', 'pending', page] as const,
  adminContract: (page: number) => ['loans', 'admin', 'contract', page] as const,
  adminDisbursement: (page: number) => ['loans', 'admin', 'disbursement', page] as const,
  adminActive: (page: number) => ['loans', 'admin', 'active', page] as const,
  adminOverdue: () => ['loans', 'admin', 'overdue'] as const,
  adminHistory: (page: number) => ['loans', 'admin', 'history', page] as const,
};

export const useLoans = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? LOAN_KEYS.byUser(userId) : LOAN_KEYS.all,
    queryFn: () => loanService.getByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLoan = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? LOAN_KEYS.byId(id) : LOAN_KEYS.all,
    queryFn: () => loanService.getById(id!),
    enabled: !!id,
  });
};

export const useAllLoans = (filters?: { status?: LoanStatus; limit?: number }) => {
  return useQuery({
    queryKey: LOAN_KEYS.allAdmin(filters),
    queryFn: () => loanService.getAll(filters),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLoanPayload) => loanService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
    },
  });
};

export const useUpdateLoanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LoanStatus }) =>
      loanService.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.byId(id) });
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
    },
  });
};

export interface LoanStats {
  totalRequested: number;
  totalPaid: number;
  totalOutstanding: number;
  activeCount: number;
  overdueCount: number;
}

export const useLoanStats = (userId: string | undefined): { stats: LoanStats; isLoading: boolean } => {
  const { data: loans = [], isLoading } = useLoans(userId);

  const stats: LoanStats = useMemo(() => {
    let totalRequested = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let activeCount = 0;
    let overdueCount = 0;
    const now = new Date();

    loans.forEach((loan) => {
      const amount = Number(loan.amount ?? 0);
      const totalDebt = Number((loan as any).total_to_pay ?? amount);
      const paid = Number(loan.metadata?.paid_amount ?? 0);
      const installments = Number(loan.installments ?? 12);

      totalRequested += amount;
      totalPaid += paid;

      if (loan.status === 'active') {
        const remaining = Math.max(0, totalDebt - paid);
        totalOutstanding += remaining;
        activeCount += 1;

        const metadata = loan.metadata as Record<string, unknown> || {};
        if (metadata.next_payment_date) {
          const nextDate = new Date(metadata.next_payment_date as string);
          if (nextDate < now) {
            overdueCount += 1;
          }
        }
      }
    });

    return { totalRequested, totalPaid, totalOutstanding, activeCount, overdueCount };
  }, [loans]);

  return { stats, isLoading };
};

export const useActiveLoan = (userId: string | undefined) => {
  const { data: loans = [] } = useLoans(userId);
  return useMemo(() => loans.find(l => l.status === 'active') || null, [loans]);
};

const PAGE_SIZE = 5;

export const useAdminPendingLoans = (page: number) => {
  return useQuery({
    queryKey: LOAN_KEYS.adminPending(page),
    queryFn: () => loanService.getAdminLoans({ status: ['pending', 'under_review'], page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminContractLoans = (page: number) => {
  return useQuery({
    queryKey: LOAN_KEYS.adminContract(page),
    queryFn: () => loanService.getAdminLoans({ status: ['approved'], page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminDisbursementLoans = (page: number) => {
  return useQuery({
    queryKey: LOAN_KEYS.adminDisbursement(page),
    queryFn: () => loanService.getAdminLoans({ status: ['signed', 'disbursed'], page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminActiveLoans = (page: number) => {
  return useQuery({
    queryKey: LOAN_KEYS.adminActive(page),
    queryFn: () => loanService.getAdminLoans({ status: ['active'], page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminOverdueLoans = () => {
  return useQuery({
    queryKey: LOAN_KEYS.adminOverdue(),
    queryFn: async () => {
      const allLoans = await loanService.getOverdueLoans();
      return { loans: allLoans, total: allLoans.length };
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminHistoryLoans = (page: number) => {
  return useQuery({
    queryKey: LOAN_KEYS.adminHistory(page),
    queryFn: () => loanService.getAdminLoans({ status: ['closed', 'cancelled'], page, pageSize: PAGE_SIZE }),
    staleTime: 1000 * 60 * 2,
  });
};