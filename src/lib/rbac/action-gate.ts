import { hasPermission } from "@/lib/rbac/helpers";
import type { ModuleKey, ActionKey } from "@/lib/rbac/modules";
import { getRbacSession } from "@/lib/rbac/session-server";
import type { RbacSessionContext } from "@/lib/rbac/types";

export type ActionGateFail = { ok: false; error: string };
export type ActionGateOk = { ok: true; ctx: RbacSessionContext };

/**
 * Fabrika paneli server action’ları: aktif oturum + fabrika bağlamı (platform_admin hariç).
 */
export async function requireActiveFactorySession(): Promise<
  ActionGateOk | ActionGateFail
> {
  const ctx = await getRbacSession();
  if (!ctx?.user || ctx.user.status !== "active") {
    return { ok: false, error: "Oturum bulunamadı veya hesap aktif değil." };
  }
  if (ctx.user.role === "PLATFORM_ADMIN") {
    return { ok: false, error: "Bu işlem fabrika paneli kullanıcıları içindir." };
  }
  if (!ctx.user.factoryId) {
    return { ok: false, error: "Fabrika bağlamı yok." };
  }
  return { ok: true, ctx };
}

/**
 * Belirtilen modül.eylem izni yoksa hata döner (RLS’e ek güvence).
 */
export async function requirePermission(
  module: ModuleKey,
  action: ActionKey,
): Promise<ActionGateOk | ActionGateFail> {
  const base = await requireActiveFactorySession();
  if (!base.ok) return base;
  if (!hasPermission(base.ctx, module, action)) {
    return { ok: false, error: "Bu işlem için yetkiniz yok." };
  }
  return { ok: true, ctx: base.ctx };
}
