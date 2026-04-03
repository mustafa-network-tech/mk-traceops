"use server";

import { revalidatePath } from "next/cache";

import {
  BOM_EXPLOSION_DEPTH_MAX,
  BOM_EXPLOSION_DEPTH_MIN,
} from "@/lib/constants/bom-explosion";
import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function updateBomExplosionDepthAction(
  rawDepth: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

  const gate = await requirePermission("company_settings", "update");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const factoryId = gate.ctx.user.factoryId;
  if (!factoryId) {
    return { ok: false, error: "Fabrika bağlamı yok." };
  }

  const n = Math.floor(Number(rawDepth));
  if (
    !Number.isFinite(n) ||
    n < BOM_EXPLOSION_DEPTH_MIN ||
    n > BOM_EXPLOSION_DEPTH_MAX
  ) {
    return {
      ok: false,
      error: `Geçerli aralık: ${BOM_EXPLOSION_DEPTH_MIN}–${BOM_EXPLOSION_DEPTH_MAX}.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("factories")
    .update({ bom_explosion_max_depth: n })
    .eq("id", factoryId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/excel-aktarim");
  return { ok: true };
}
