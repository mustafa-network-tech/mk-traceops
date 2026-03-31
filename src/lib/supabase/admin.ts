import { createClient } from "@supabase/supabase-js";

import {
  isSupabaseConfigured,
  requireSupabaseEnv,
} from "@/lib/supabase/env";

/**
 * Yalnızca sunucuda, güvenli ortamda (import API, arka plan işi).
 * Asla istemciye veya NEXT_PUBLIC_* ile gömme.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Toplu import / RLS bypass için sunucu ortamında ayarlayın.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseAdminConfigured(): boolean {
  return (
    isSupabaseConfigured() &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  );
}
