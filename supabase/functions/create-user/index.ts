import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://fintech-lendly.vercel.app";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
});

function getCorsHeaders(origin: string | null): Headers {
  const allowed = origin && [APP_ORIGIN, 'http://localhost:8082', 'http://localhost:5173'].includes(origin);
  return new Headers({
    'Access-Control-Allow-Origin': allowed ? origin : APP_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  });
}

async function verifyAdminAuth(req: Request): Promise<{ ok: boolean; error?: string; status?: number }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { ok: false, error: 'Invalid or expired token', status: 401 };
  }

  const { data: profile } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).maybeSingle();

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Admin access required', status: 403 };
  }

  return { ok: true };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    // Verify JWT + admin role
    const authResult = await verifyAdminAuth(req);
    if (!authResult.ok) {
      return new Response(JSON.stringify({ error: authResult.error }), { status: authResult.status, headers: corsHeaders });
    }

    const body = await req.json();

    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      address,
      birth_date,
      curp,
      ine_key,
      role,
    } = body as Record<string, any>;

    if (!email) return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: corsHeaders });

    // Create auth user via admin API
    const { data: createData, error: createError } = await (supabaseAdmin.auth as any).admin.createUser({
      email,
      password: password || undefined,
      user_metadata: { first_name, last_name, phone, address, birth_date, curp, ine_key },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message || createError }), { status: 400, headers: corsHeaders });
    }

    const user = (createData && (createData.user || createData)) || null;
    const userId = user?.id || null;

    // Upsert profile in 'users' table
    const profilePayload: any = {
      id: userId,
      email,
      first_name,
      last_name,
      phone,
      address,
      birth_date: birth_date || null,
      curp,
      ine_key,
      role,
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message || profileError }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ user, profile }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Exception in create-user function', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
