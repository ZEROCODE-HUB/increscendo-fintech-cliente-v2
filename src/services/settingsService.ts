import { IS_DEMO } from '@/client/lib/env';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
  maintenance_web: boolean;
  maintenance_admin: boolean;
  message: string | null;
  updated_at: string | null;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const CACHE_KEY = 'app_settings_maintenance';
const CACHE_TTL_MS = 1000 * 120;

const DEFAULT_SETTINGS: AppSettings = {
  maintenance_web: false,
  maintenance_admin: false,
  message: null,
  updated_at: null,
};

let memoryCache: { data: AppSettings; fetchedAt: number } | null = null;
let inflight: Promise<AppSettings> | null = null;

function readLocalCache(): AppSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: AppSettings; fetchedAt: number };
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(data: AppSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    // ignore storage quota/serialization errors
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  if (IS_DEMO) return { maintenance_web: false, maintenance_admin: false, message: null, updated_at: null };
  if (memoryCache && Date.now() - memoryCache.fetchedAt <= CACHE_TTL_MS) {
    return memoryCache.data;
  }

  const cached = readLocalCache();
  if (cached) {
    memoryCache = { data: cached, fetchedAt: Date.now() };
    return cached;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('maintenance_web, maintenance_admin, message, updated_at')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

      if (error) throw error;

      const settings: AppSettings = data
        ? {
            maintenance_web: data.maintenance_web ?? false,
            maintenance_admin: data.maintenance_admin ?? false,
            message: data.message ?? null,
            updated_at: data.updated_at ?? null,
          }
        : DEFAULT_SETTINGS;

      memoryCache = { data: settings, fetchedAt: Date.now() };
      writeLocalCache(settings);
      return settings;
    } catch (err) {
      // Fail-open: ante errores de red/BD no bloqueamos la aplicación.
      console.error('[getAppSettings] error, fail-open', err);
      return DEFAULT_SETTINGS;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function invalidateMaintenanceCache() {
  memoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}