import { supabase } from './supabase';

const INCRESCENDO_API_BASE_URL = 'https://increscendo-api.vercel.app';
// const INCRESCENDO_API_BASE_URL = 'http://localhost:3200';

const DEFAULT_TIMEOUT = 90000;

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    // Refresh if less than 60 seconds until expiry
    return Date.now() >= expiresAt - 60000;
  } catch {
    return true;
  }
}

export const getSupabaseAccessToken = async (): Promise<string> => {
  // 1. Get cached session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn('[increscendoApi] getSession error:', sessionError.message);
  }

  let token = session?.access_token;

  // 2. If token exists but is about to expire, refresh it
  if (token && isTokenExpiringSoon(token)) {
    console.warn('[increscendoApi] Token expiring soon, refreshing...');
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[increscendoApi] refreshSession error:', refreshError.message);
    }
    token = refreshed?.session?.access_token ?? token;
  }

  // 3. If still no token, try refreshSession as a full recovery attempt
  if (!token) {
    console.warn('[increscendoApi] No token, attempting full refreshSession recovery');
    const { data: recovered, error: recoveryError } = await supabase.auth.refreshSession();
    if (recoveryError) {
      console.warn('[increscendoApi] recovery refreshSession error:', recoveryError.message);
    }
    token = recovered?.session?.access_token ?? null;
  }

  // 4. Last resort: getUser forces Supabase to validate with the server
  if (!token) {
    console.warn('[increscendoApi] Still no token, trying getUser as last resort');
    const { data: userData } = await supabase.auth.getUser();
    // getUser doesn't return session in v2, but it may trigger a silent refresh
    // Try getSession again after getUser
    const { data: retrySession } = await supabase.auth.getSession();
    token = retrySession?.session?.access_token ?? null;
  }

  if (!token) {
    throw new Error('No se encontró una sesión activa. Inicia sesión de nuevo para continuar.');
  }

  return token;
};

export interface IncrescendoFetchOptions extends RequestInit {
  timeout?: number;
}

export const increscendoApiFetch = async (path: string, init: IncrescendoFetchOptions = {}) => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchInit } = init;

  let token: string;
  try {
    token = await getSupabaseAccessToken();
  } catch (err) {
    throw new Error('No se pudo obtener tu sesión. Recarga la página e intenta de nuevo.');
  }

  const url = path.startsWith('http') ? path : `${INCRESCENDO_API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(fetchInit.headers || {});

  // Always set Authorization — never skip it
  headers.set('Authorization', `Bearer ${token}`);

  if (fetchInit.body && !(fetchInit.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If 401, try one token refresh + retry (handles stale token on iOS)
    if (response.status === 401) {
      console.warn('[increscendoApi] 401 received, attempting token refresh + retry');
      const { data: refreshed } = await supabase.auth.refreshSession();
      const newToken = refreshed?.session?.access_token;
      if (newToken && newToken !== token) {
        headers.set('Authorization', `Bearer ${newToken}`);
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
        try {
          const retryResponse = await fetch(url, {
            ...fetchInit,
            headers,
            signal: retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          return retryResponse;
        } catch (retryErr) {
          clearTimeout(retryTimeoutId);
          throw retryErr;
        }
      }
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const timeoutSec = Math.round(timeout / 1000);
    if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('abort'))) {
      throw new Error(`La solicitud tardó demasiado tiempo (timeout: ${timeoutSec}s). Intenta de nuevo.`);
    }
    throw error;
  }
};
