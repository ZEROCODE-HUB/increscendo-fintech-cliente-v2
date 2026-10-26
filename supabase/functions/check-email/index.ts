import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://fintech-lendly.vercel.app";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing required environment variables');
}

const supabaseAdmin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
});

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && [APP_ORIGIN, 'http://localhost:8082', 'http://localhost:5173'].includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : APP_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    // Verify JWT — any authenticated user can check emails during registration
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    let email: string;
    try {
      const body = await req.json();
      email = body?.email;
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    if (!email || typeof email !== 'string') {
      return jsonResponse({ error: 'email is required' }, 400, corsHeaders);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Direct query instead of listing all users — more efficient and secure
    const { data, error: queryError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (queryError) {
      console.error('Error checking email:', queryError);
      return jsonResponse({ error: 'Failed to check email' }, 500, corsHeaders);
    }

    return jsonResponse({ exists: !!data }, 200, corsHeaders);
  } catch (err) {
    console.error('Exception in check-email function:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
});
