import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Simple in-memory storage to avoid tocar localStorage/session del cliente principal
const memoryStorage = {
  getItem(_: string) {
    return null;
  },
  setItem(_: string, __: string) {
    // no-op
  },
  removeItem(_: string) {
    // no-op
  },
};

// Cliente Supabase alterno para acciones administrativas (crear usuarios)
// No persiste sesión ni modifica el estado de auth del cliente principal.
export const supabaseAdmin = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'demo-anon-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storage: memoryStorage as any,
  },
});

export default supabaseAdmin;
