import { cookies } from "next/headers";

import { getSessionContextByProfileId } from "@/lib/data/rbac-supabase";
import { isRbacProfileCookieAllowed, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RbacSessionContext } from "@/lib/rbac/types";
import { hasPermission } from "@/lib/rbac/helpers";
import { requiredPermissionForPath } from "@/lib/rbac/route-access";

/** Yeni çerez adı (auth.users / profiles.id ile aynı UUID). */
export const RBAC_PROFILE_COOKIE = "mk_rbac_profile_id";
/** Eski ad — geriye dönük uyumluluk. */
export const RBAC_USER_COOKIE = "mk_rbac_user_id";

export async function getRbacCookieProfileId(): Promise<string | null> {
  const jar = await cookies();
  const v =
    jar.get(RBAC_PROFILE_COOKIE)?.value?.trim() ||
    jar.get(RBAC_USER_COOKIE)?.value?.trim();
  return v && v.length > 0 ? v : null;
}

export async function getRbacSession(): Promise<RbacSessionContext | null> {
  if (!isSupabaseConfigured()) return null;

  let profileId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) profileId = user.id;
  } catch {
    /* oturum yok */
  }

  if (!profileId && isRbacProfileCookieAllowed()) {
    profileId = await getRbacCookieProfileId();
  }

  if (!profileId) return null;
  return getSessionContextByProfileId(profileId);
}

export async function userCanAccessPanelPath(
  pathname: string,
): Promise<boolean> {
  const ctx = await getRbacSession();
  if (!ctx?.user || ctx.user.status !== "active") return false;
  const req = requiredPermissionForPath(pathname);
  if (!req) return true;
  return hasPermission(ctx, req.module, req.action);
}
