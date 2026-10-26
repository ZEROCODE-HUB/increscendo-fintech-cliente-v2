import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "./lib/api";
import { journey } from "./lib/rules";

export const CK = {
  profile: ["c", "profile"] as const,
  membership: ["c", "membership"] as const,
  plans: ["c", "plans"] as const,
  methods: ["c", "methods"] as const,
  loans: ["c", "loans"] as const,
  installments: (id: string) => ["c", "installments", id] as const,
  movements: ["c", "movements"] as const,
  notifications: ["c", "notifications"] as const,
  banks: ["c", "banks"] as const,
  card: ["c", "card"] as const,
};

const useUid = () => useAuth().userId ?? "";

export function useProfile() {
  const uid = useUid();
  return useQuery({ queryKey: CK.profile, queryFn: () => api.getProfile(uid), enabled: !!uid, staleTime: 30_000 });
}
export function useMembership() {
  const uid = useUid();
  return useQuery({ queryKey: CK.membership, queryFn: () => api.getMembership(uid), enabled: !!uid, staleTime: 30_000 });
}
export function usePlans() {
  return useQuery({ queryKey: CK.plans, queryFn: api.listPlans, staleTime: 5 * 60_000 });
}
export function usePaymentMethods() {
  const uid = useUid();
  return useQuery({ queryKey: CK.methods, queryFn: () => api.listPaymentMethods(uid), enabled: !!uid });
}
export function useLoans() {
  const uid = useUid();
  return useQuery({ queryKey: CK.loans, queryFn: () => api.listLoans(uid), enabled: !!uid });
}
export function useMovements() {
  const uid = useUid();
  return useQuery({ queryKey: CK.movements, queryFn: () => api.listMovements(uid), enabled: !!uid });
}
export function useNotifications() {
  const uid = useUid();
  return useQuery({ queryKey: CK.notifications, queryFn: () => api.listNotifications(uid), enabled: !!uid, refetchInterval: 60_000 });
}
export function useBanks() {
  return useQuery({ queryKey: CK.banks, queryFn: api.listBanks, staleTime: 60 * 60_000 });
}
export function useCard() {
  return useQuery({ queryKey: CK.card, queryFn: api.getCardState });
}

/** Perfil + membresía + reglas derivadas, en un solo hook. */
export function useJourney() {
  const p = useProfile();
  const m = useMembership();
  return {
    profile: p.data ?? null,
    membership: m.data ?? null,
    isLoading: p.isLoading || m.isLoading,
    ...journey(p.data, m.data),
  };
}

export function useRefresh() {
  const qc = useQueryClient();
  return (...keys: (readonly string[])[]) =>
    Promise.all((keys.length ? keys : [["c"]]).map((k) => qc.invalidateQueries({ queryKey: k as string[] })));
}
