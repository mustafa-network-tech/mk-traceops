import { cookies } from "next/headers";

import { getDatabase } from "@/lib/d1/database";
import { RbacSessionRepository } from "@/lib/d1/repositories/rbac-session";
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
  const profileId = await getRbacCookieProfileId();
  if (!profileId) return null;
  return new RbacSessionRepository(getDatabase()).findContext(profileId);
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
