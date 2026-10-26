import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
});

const CORS_HEADERS = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: CORS_HEADERS });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired JWT' }), { status: 401, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const { user_id, new_password } = body as Record<string, any>;

    if (!user_id || !new_password) {
      return new Response(JSON.stringify({ error: 'user_id and new_password are required' }), { status: 400, headers: CORS_HEADERS });
    }

    if (userData.user.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized: cannot change another user password' }), { status: 403, headers: CORS_HEADERS });
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers: CORS_HEADERS });
    }

    const { data, error } = await (supabaseAdmin.auth as any).admin.updateUserById(user_id, {
      password: new_password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message || error }), { status: 400, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Exception in change-password function', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});