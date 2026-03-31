import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Sunucu bileşenleri, Route Handler ve Server Action için.
 * Oturum çerezleri Auth kurulunca senkronize edilir.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Component içinde setCookie yasaklanabilir; Auth refresh Route Handler’da yapılır */
        }
      },
    },
  });
}
