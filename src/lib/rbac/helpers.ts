import type { ModuleKey, ActionKey } from "@/lib/rbac/modules";
import { permissionKey } from "@/lib/rbac/modules";
import type { RbacSessionContext, RbacUser } from "@/lib/rbac/types";

export function isPlatformAdmin(user: RbacUser): boolean {
  return user.role === "PLATFORM_ADMIN";
}

export function isCompanyAdmin(user: RbacUser): boolean {
  return user.role === "COMPANY_ADMIN";
}

export function belongsToFactory(user: RbacUser, factoryId: string): boolean {
  if (isPlatformAdmin(user)) return false;
  return user.factoryId === factoryId;
}

export function hasPermission(
  ctx: RbacSessionContext | null,
  module: ModuleKey,
  action: ActionKey,
): boolean {
  if (!ctx?.user || ctx.user.status !== "active") return false;
  return ctx.permissions.has(permissionKey(module, action));
}

export function canInviteUsers(ctx: RbacSessionContext | null): boolean {
  return hasPermission(ctx, "invitations", "create");
}

export function canAssignRoles(ctx: RbacSessionContext | null): boolean {
  return hasPermission(ctx, "user_management", "assign_role");
}

export function canApproveFactory(ctx: RbacSessionContext | null): boolean {
  return hasPermission(ctx, "factories", "approve");
}

export function canAccessPlatformArea(user: RbacUser): boolean {
  return isPlatformAdmin(user) && user.status === "active";
}

export function canAccessFactoryPanel(user: RbacUser): boolean {
  if (isPlatformAdmin(user)) return false;
  return (
    user.status === "active" &&
    user.factoryId != null &&
    user.role !== "PLATFORM_ADMIN"
  );
}
