"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { getDatabase } from "@/lib/d1/database";
import { PartsOverviewRepository } from "@/lib/d1/repositories/parts-overview";

export type PartChildLinkActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPartChildLinkAction(input: {
  parentPartId: string;
  childPartId: string;
  quantityPerParent: number;
}): Promise<PartChildLinkActionResult> {
  const gate = await requirePermission("parts_materials", "update");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const parentPartId = input.parentPartId?.trim();
  const childPartId = input.childPartId?.trim();
  if (!parentPartId || !childPartId) {
    return { ok: false, error: "Üst ve alt parça seçilmelidir." };
  }
  if (parentPartId === childPartId) {
    return { ok: false, error: "Üst ve alt parça aynı olamaz." };
  }

  const q = Number(input.quantityPerParent);
  if (!Number.isFinite(q) || q <= 0) {
    return { ok: false, error: "Birim başına miktar pozitif olmalıdır." };
  }

  const factoryId = gate.ctx.user.factoryId!;
  const repository = new PartsOverviewRepository(getDatabase(), { factoryId, actorId: gate.ctx.user.id });
  try {
    await repository.addChildLink(parentPartId, childPartId, q);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bağlantı eklenemedi.";
    if (/unique|constraint failed/i.test(message)) {
      return { ok: false, error: "Bu üst–alt parça bağlantısı zaten var." };
    }
    return { ok: false, error: message };
  }

  revalidatePath("/ana-parca-listesi");
  return { ok: true };
}

export async function deletePartChildLinkAction(
  linkId: string,
): Promise<PartChildLinkActionResult> {
  const gate = await requirePermission("parts_materials", "update");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const id = linkId?.trim();
  if (!id) {
    return { ok: false, error: "Geçersiz kayıt." };
  }

  const factoryId = gate.ctx.user.factoryId!;
  const repository = new PartsOverviewRepository(getDatabase(), { factoryId, actorId: gate.ctx.user.id });
  if (!(await repository.deleteChildLink(id))) return { ok: false, error: "Kayıt bulunamadı veya bu fabrikaya ait değil." };

  revalidatePath("/ana-parca-listesi");
  return { ok: true };
}
