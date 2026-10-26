import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipService, type MembershipPlan, type UserMembership } from '@/services/membershipService';

export const MEMBERSHIP_KEYS = {
  plans: ['memberships', 'plans'] as const,
  userMembership: (userId: string) => ['memberships', 'user', userId] as const,
  userHistory: (userId: string) => ['memberships', 'history', userId] as const,
  allAdmin: ['memberships', 'admin'] as const,
};

export const useMembershipPlans = () => {
  return useQuery({
    queryKey: MEMBERSHIP_KEYS.plans,
    queryFn: () => membershipService.getPlans(),
    staleTime: 1000 * 60 * 30,
  });
};

export const useUserMembership = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? MEMBERSHIP_KEYS.userMembership(userId) : MEMBERSHIP_KEYS.plans,
    queryFn: () => membershipService.getUserMembership(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserMembershipHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? MEMBERSHIP_KEYS.userHistory(userId) : MEMBERSHIP_KEYS.plans,
    queryFn: () => membershipService.getUserMembershipHistory(userId!),
    enabled: !!userId,
  });
};

export const usePurchaseMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      membershipService.purchasePlan(userId, planId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_KEYS.userMembership(userId) });
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_KEYS.userHistory(userId) });
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_KEYS.allAdmin });
    },
  });
};

export const useCancelMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) => membershipService.cancelMembership(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_KEYS.allAdmin });
    },
  });
};