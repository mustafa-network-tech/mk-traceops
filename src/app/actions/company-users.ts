"use server";

import { revalidatePath } from "next/cache";

import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  listInvitationsInFactory,
  setUserActiveFlag,
  updateUserRoleInFactory,
} from "@/lib/data/rbac-supabase";
import {
  canAssignRoles,
  canInviteUsers,
  hasPermission,
  isCompanyAdmin,
} from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";
import type { RoleKey } from "@/lib/rbac/types";

async function requireCompanyAdmin() {
  const ctx = await getRbacSession();
  if (!ctx?.user || !isCompanyAdmin(ctx.user) || !ctx.user.factoryId) {
    return { ok: false as const, error: "Yalnızca fabrika yöneticisi." };
  }
  if (ctx.user.status !== "active") {
    return { ok: false as const, error: "Hesap aktif değil." };
  }
  return { ok: true as const, ctx };
}

export async function inviteFactoryUserAction(form: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Exclude<RoleKey, "PLATFORM_ADMIN">;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireCompanyAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };
  if (!canInviteUsers(gate.ctx)) {
    return { ok: false, error: "Davet oluşturma yetkisi yok." };
  }
  const r = await createInvitation({
    factoryId: gate.ctx.user.factoryId!,
    invitedByUserId: gate.ctx.user.id,
    email: form.email,
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    role: form.role,
  });
  if (!r.ok) return r;
  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

export async function acceptInvitationAction(
  invitationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireCompanyAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };
  const inv = await listInvitationsInFactory(gate.ctx.user.factoryId!);
  const hit = inv.find((i) => i.id === invitationId);
  if (!hit || hit.factoryId !== gate.ctx.user.factoryId) {
    return { ok: false, error: "Davet bulunamadı." };
  }
  const r = await acceptInvitation(invitationId);
  if (!r.ok) return r;
  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

export async function cancelInvitationAction(
  invitationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireCompanyAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };
  const r = await cancelInvitation(invitationId);
  if (!r.ok) return r;
  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

export async function changeFactoryUserRoleAction(form: {
  targetUserId: string;
  newRole: Exclude<RoleKey, "PLATFORM_ADMIN">;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireCompanyAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };
  if (!canAssignRoles(gate.ctx)) {
    return { ok: false, error: "Rol atama yetkisi yok." };
  }
  const r = await updateUserRoleInFactory({
    actorFactoryId: gate.ctx.user.factoryId!,
    targetUserId: form.targetUserId,
    newRole: form.newRole,
  });
  if (!r.ok) return r;
  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}

export async function setFactoryUserActiveAction(form: {
  targetUserId: string;
  active: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireCompanyAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };
  if (!hasPermission(gate.ctx, "user_management", "update")) {
    return { ok: false, error: "Kullanıcı güncelleme yetkisi yok." };
  }
  const r = await setUserActiveFlag({
    actorFactoryId: gate.ctx.user.factoryId!,
    targetUserId: form.targetUserId,
    active: form.active,
  });
  if (!r.ok) return r;
  revalidatePath("/yonetim/kullanicilar");
  return { ok: true };
}
