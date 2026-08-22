import { getDatabase } from "@/lib/d1/database";
import { RbacSessionRepository } from "@/lib/d1/repositories/rbac-session";
import type { ActorOption } from "@/lib/rbac/types";
import { isRbacProfileCookieAllowed } from "@/lib/rbac/profile-cookie";

/**
 * Oturum seçici: yalnızca RBAC_ALLOW_PROFILE_COOKIE açıkken doldurulur.
 * Canlıda kullanıcılar yalnızca Supabase Auth ile girer.
 */
export async function loadActorSwitcherOptions(): Promise<ActorOption[]> {
  if (!isRbacProfileCookieAllowed()) return [];
  return new RbacSessionRepository(getDatabase()).listActorOptions();
}
