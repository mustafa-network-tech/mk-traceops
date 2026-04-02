"use server";

import { revalidatePath } from "next/cache";

import {
  approveFactoryRequest,
  rejectFactoryRequest,
  updateFactoryPackage,
  updateFactoryStatus,
} from "@/lib/data/rbac-supabase";
import { getRbacSession } from "@/lib/rbac/session-server";
import { canApproveFactory, isPlatformAdmin } from "@/lib/rbac/helpers";
import type { FactoryStatus } from "@/lib/rbac/types";

async function requirePlatformAdmin() {
  const ctx = await getRbacSession();
  if (!ctx?.user || !isPlatformAdmin(ctx.user)) {
    return { ok: false as const, error: "Yetkisiz." };
  }
  return { ok: true as const, ctx };
}

export async function rejectFactoryRequestAction(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return gate;
  if (!canApproveFactory(gate.ctx)) {
    return { ok: false, error: "Fabrika onay yetkisi yok." };
  }
  const r = await rejectFactoryRequest(requestId, gate.ctx.user.id);
  if (!r.ok) return r;
  revalidatePath("/platform");
  revalidatePath("/platform/fabrika-talepleri");
  return { ok: true };
}

export async function approveFactoryRequestAction(form: {
  requestId: string;
  firstAdminEmail: string;
  firstAdminFirstName: string;
  firstAdminLastName: string;
  firstAdminPhone?: string;
  packageStatus?: string;
}): Promise<{ ok: true; factoryId: string } | { ok: false; error: string }> {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return gate;
  if (!canApproveFactory(gate.ctx)) {
    return { ok: false, error: "Fabrika onay yetkisi yok." };
  }
  const r = await approveFactoryRequest({
    requestId: form.requestId,
    platformAdminId: gate.ctx.user.id,
    firstAdminEmail: form.firstAdminEmail,
    firstAdminFirstName: form.firstAdminFirstName,
    firstAdminLastName: form.firstAdminLastName,
    firstAdminPhone: form.firstAdminPhone,
    packageStatus: form.packageStatus,
  });
  if (!r.ok) return r;
  revalidatePath("/platform");
  revalidatePath("/platform/fabrika-talepleri");
  revalidatePath("/platform/fabrikalar");
  return r;
}

export async function setFactoryStatusAction(
  factoryId: string,
  status: FactoryStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return gate;
  const r = await updateFactoryStatus(factoryId, status);
  if (!r.ok) return r;
  revalidatePath("/platform");
  revalidatePath("/platform/fabrikalar");
  return { ok: true };
}

export async function setFactoryPackageAction(
  factoryId: string,
  packageStatus: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return gate;
  const r = await updateFactoryPackage(factoryId, packageStatus);
  if (!r.ok) return r;
  revalidatePath("/platform");
  revalidatePath("/platform/fabrikalar");
  return { ok: true };
}
