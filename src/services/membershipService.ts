import { supabase } from '@/lib/supabase';

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  active: boolean;
  features: {
    benefits: string[];
    targetAudience?: string;
    interestRate?: number;
  };
}

export interface UserMembership {
  id: string;
  user_id: string;
  membership_plan_id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  started_at: string;
  expires_at: string;
  created_at: string;
  membership_plans?: MembershipPlan;
}

export const membershipService = {
  async getPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserMembership(userId: string): Promise<UserMembership | null> {
    const { data, error } = await supabase
      .from('user_memberships')
      .select('*, membership_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserMembershipHistory(userId: string): Promise<UserMembership[]> {
    const { data, error } = await supabase
      .from('user_memberships')
      .select('*, membership_plans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async purchasePlan(userId: string, planId: string): Promise<UserMembership> {
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('duration_days')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const { data, error } = await supabase
      .from('user_memberships')
      .insert({
        user_id: userId,
        membership_plan_id: planId,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('*, membership_plans(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancelMembership(membershipId: string): Promise<void> {
    const { error } = await supabase
      .from('user_memberships')
      .update({ status: 'cancelled' })
      .eq('id', membershipId);

    if (error) throw error;
  },
};