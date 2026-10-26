import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Supabase credentials are not set in src/lib/supabaseConfig.ts');
}

export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_ANON_KEY || 'demo-anon-key');

export default supabase;
