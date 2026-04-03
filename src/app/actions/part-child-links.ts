"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type PartChildLinkActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addPartChildLinkAction(input: {
  parentPartId: string;
  childPartId: string;
  quantityPerParent: number;
}): Promise<PartChildLinkActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

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

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("part_child_parts").insert({
    parent_part_id: parentPartId,
    child_part_id: childPartId,
    quantity_per_parent: q,
    unit: "adet",
  });

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { ok: false, error: "Bu üst–alt parça bağlantısı zaten var." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/ana-parca-listesi");
  return { ok: true };
}

export async function deletePartChildLinkAction(
  linkId: string,
): Promise<PartChildLinkActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

  const gate = await requirePermission("parts_materials", "update");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const id = linkId?.trim();
  if (!id) {
    return { ok: false, error: "Geçersiz kayıt." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("part_child_parts").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/ana-parca-listesi");
  return { ok: true };
}
