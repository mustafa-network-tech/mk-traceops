"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getDatabase } from "@/lib/d1/database";
import { RbacSessionRepository } from "@/lib/d1/repositories/rbac-session";
import { isRbacProfileCookieAllowed } from "@/lib/rbac/profile-cookie";
import {
  RBAC_PROFILE_COOKIE,
  RBAC_USER_COOKIE,
} from "@/lib/rbac/session-server";

export async function setRbacSessionUserAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isRbacProfileCookieAllowed()) {
    return {
      ok: false,
      error:
        "Profil çerezi devre dışı. RBAC_ALLOW_PROFILE_COOKIE=true ile açın veya Supabase ile giriş yapın.",
    };
  }
  const context = await new RbacSessionRepository(getDatabase()).findContext(userId);
  if (!context?.user) return { ok: false, error: "Profil bulunamadı." };
  const jar = await cookies();
  jar.set(RBAC_PROFILE_COOKIE, userId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  jar.delete(RBAC_USER_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearRbacSessionCookieAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(RBAC_PROFILE_COOKIE);
  jar.delete(RBAC_USER_COOKIE);
  revalidatePath("/", "layout");
}
