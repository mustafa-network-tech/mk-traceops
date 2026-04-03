import { redirect } from "next/navigation";

import { hasPermission } from "@/lib/rbac/helpers";
import type { ModuleKey, ActionKey } from "@/lib/rbac/modules";
import { getRbacSession } from "@/lib/rbac/session-server";

/**
 * Fabrika paneli RSC: izin yoksa /yetkisiz (menü + istemci guard’a ek güvence).
 */
export async function requirePanelModule(
  module: ModuleKey,
  action: ActionKey,
): Promise<void> {
  const ctx = await getRbacSession();
  if (!hasPermission(ctx, module, action)) {
    redirect("/yetkisiz");
  }
}
