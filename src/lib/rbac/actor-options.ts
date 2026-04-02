import { listProfilesForSwitcher } from "@/lib/data/rbac-supabase";
import type { ActorOption } from "@/lib/rbac/types";
import { isRbacProfileCookieAllowed } from "@/lib/supabase/env";

/**
 * Oturum seçici: yalnızca RBAC_ALLOW_PROFILE_COOKIE açıkken doldurulur.
 * Canlıda kullanıcılar yalnızca Supabase Auth ile girer.
 */
export async function loadActorSwitcherOptions(): Promise<ActorOption[]> {
  if (!isRbacProfileCookieAllowed()) return [];
  const profiles = await listProfilesForSwitcher();
  return profiles.map((p) => ({
    id: p.id,
    role: p.role,
    label:
      p.role === "PLATFORM_ADMIN"
        ? `${p.firstName} ${p.lastName}`
        : `${p.firstName} ${p.lastName} · ${p.email}`,
  }));
}
