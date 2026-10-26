import { supabase } from '@/lib/supabase';
import type { Client, ClientMembership, ClientColumnConfig } from '@/types/clients';

export const defaultClientColumns: ClientColumnConfig[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'role', label: 'Rol', visible: true },
  { key: 'firstName', label: 'Nombre', visible: true },
  { key: 'lastName', label: 'Apellido', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'phone', label: 'Teléfono', visible: false },
  { key: 'address', label: 'Dirección', visible: false },
  { key: 'birthDate', label: 'F. Nac.', visible: false },
  { key: 'registrationDate', label: 'F. Reg.', visible: true },
  { key: 'ine', label: 'INE', visible: false },
  { key: 'curp', label: 'CURP', visible: false },
  { key: 'membership', label: 'Membresía', visible: true },
  { key: 'membershipStatus', label: 'Est. Memb.', visible: true },
  { key: 'loans', label: 'Préstamos', visible: true },
];

export const defaultMembershipColumns: ClientColumnConfig[] = [
  { key: 'firstName', label: 'Nombre', visible: true },
  { key: 'lastName', label: 'Apellidos', visible: true },
  { key: 'ine', label: 'INE', visible: true },
  { key: 'membershipType', label: 'Membresía', visible: true },
  { key: 'activationDate', label: 'F. Activación', visible: true },
  { key: 'expirationDate', label: 'F. Expiración', visible: true },
  { key: 'renewalCount', label: 'Conteo Renov.', visible: false },
  { key: 'status', label: 'Estado', visible: true },
];

export interface ClientsResult {
  clients: Client[];
  total: number;
}

export const clientService = {
  async getClients(page: number = 1, pageSize: number = 10): Promise<ClientsResult> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select('id, code, role, email, first_name, last_name, phone, address, birth_date, curp, ine_key, created_at, ine_front_url, ine_back_url, curp_url, avatar_url', { count: 'exact' })
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const { data: memberships } = await supabase
      .from('user_memberships')
      .select('user_id, status, membership_plans(name)');

    const membershipByUser = new Map<string, { membership: string; status: string }>();
    memberships?.forEach((m: any) => {
      const current = membershipByUser.get(m.user_id);
      if (!current) {
        membershipByUser.set(m.user_id, {
          membership: m.membership_plans?.name || '',
          status: m.status,
        });
      }
    });

    const { data: loansData } = await supabase
      .from('loans')
      .select('user_id, status');

    const loanCountsByUser = new Map<string, { total: number; active: number }>();
    loansData?.forEach((loan: any) => {
      const userId = loan.user_id;
      if (!loanCountsByUser.has(userId)) {
        loanCountsByUser.set(userId, { total: 0, active: 0 });
      }
      const counts = loanCountsByUser.get(userId)!;
      counts.total += 1;
      if (loan.status === 'active') counts.active += 1;
    });

    const clients: Client[] = (data || []).map((u: any) => {
      const membership = membershipByUser.get(u.id);
      const loanCounts = loanCountsByUser.get(u.id) || { total: 0, active: 0 };
      return {
        id: u.id,
        code: u.code || '',
        role: u.role === 'admin' ? 'Admin' : 'Usuario',
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
        birthDate: u.birth_date || '',
        registrationDate: (u.created_at || '').slice(0, 10),
        ine: u.ine_key || '',
        curp: u.curp || '',
        photoUrl: u.avatar_url,
        ineFrontUrl: u.ine_front_url,
        ineBackUrl: u.ine_back_url,
        curpUrl: u.curp_url,
        membership: membership?.membership || '',
        membershipStatus: membership?.status || 'Sin membresía',
        totalLoans: loanCounts.total,
        activeLoans: loanCounts.active,
      };
    });

    return { clients, total: count || 0 };
  },

  async getClientById(id: string): Promise<Client | null> {
    const { data: u, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: u.id,
      code: u.code || '',
      role: u.role === 'admin' ? 'Admin' : 'Usuario',
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      address: u.address || '',
      birthDate: u.birth_date || '',
      registrationDate: (u.created_at || '').slice(0, 10),
      ine: u.ine_key || '',
      curp: u.curp || '',
      membership: '',
      membershipStatus: '',
      totalLoans: 0,
      activeLoans: 0,
    };
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updates.firstName) payload.first_name = updates.firstName;
    if (updates.lastName) payload.last_name = updates.lastName;
    if (updates.email) payload.email = updates.email;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.address) payload.address = updates.address;
    if (updates.birthDate) payload.birth_date = updates.birthDate;
    if (updates.ine) payload.ine_key = updates.ine;
    if (updates.curp) payload.curp = updates.curp;
    if (updates.role) payload.role = updates.role === 'Admin' ? 'admin' : 'client';

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMemberships(page: number = 1, pageSize: number = 10): Promise<{ memberships: ClientMembership[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('user_memberships')
      .select('id, user_id, status, started_at, expires_at, created_at, membership_plans(name), users(first_name, last_name, ine_key)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const memberships: ClientMembership[] = (data || []).map((m: any) => ({
      id: m.id,
      clientId: m.user_id,
      firstName: m.users?.first_name || '',
      lastName: m.users?.last_name || '',
      ine: m.users?.ine_key || '',
      membershipType: m.membership_plans?.name || '',
      activationDate: (m.started_at || m.created_at || '').slice(0, 10),
      expirationDate: (m.expires_at || '').slice(0, 10),
      renewalCount: 0,
      status: m.status === 'active' ? 'Activa' : m.status === 'expired' ? 'Vencida' : m.status,
      paymentHistory: [],
    }));

    return { memberships, total: count || 0 };
  },
};