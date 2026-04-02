import { mainNav } from "@/lib/constants/navigation";
import { hasPermission } from "@/lib/rbac/helpers";
import type { RbacSessionContext } from "@/lib/rbac/types";
import { requiredPermissionForPath } from "@/lib/rbac/route-access";

/** Panel menüsünde gösterilecek href listesi (izinlere göre). */
export function allowedPanelHrefs(ctx: RbacSessionContext | null): string[] {
  if (!ctx?.user || ctx.user.status !== "active") return [];
  const hrefs: string[] = [];
  for (const item of mainNav) {
    const req = requiredPermissionForPath(item.href);
    if (!req || hasPermission(ctx, req.module, req.action)) {
      hrefs.push(item.href);
    }
  }
  if (hasPermission(ctx, "user_management", "read")) {
    hrefs.push("/yonetim/kullanicilar");
  }
  return hrefs;
}

export function isPathAllowedForPanel(
  pathname: string,
  allowed: Iterable<string>,
): boolean {
  const set = new Set(allowed);
  if (set.has(pathname)) return true;
  for (const p of set) {
    if (pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}
