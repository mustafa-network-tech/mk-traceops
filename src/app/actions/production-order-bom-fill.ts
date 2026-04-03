"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type FillProductionOrderBomResult =
  | { ok: true; lineCount: number; replaced: boolean }
  | { ok: false; error: string };

export async function fillProductionOrderLinesFromBomAction(input: {
  orderId: string;
  replaceExisting: boolean;
}): Promise<FillProductionOrderBomResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

  const gate = await requirePermission("production_orders", "update");
  if (!gate.ok) return { ok: false, error: gate.error };

  const orderId = input.orderId?.trim();
  if (!orderId) return { ok: false, error: "Emir seçilmedi." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("fill_production_order_lines_from_bom", {
    p_order_id: orderId,
    p_replace_existing: Boolean(input.replaceExisting),
  });

  if (error) {
    if (
      error.code === "PGRST202" ||
      /fill_production_order_lines_from_bom|function.*not found|schema cache/i.test(
        error.message ?? "",
      )
    ) {
      return {
        ok: false,
        error:
          "Veritabanında «fill_production_order_lines_from_bom» henüz yok. İlgili migration dosyasını uygulayın.",
      };
    }
    return { ok: false, error: error.message || "Satırlar yazılamadı." };
  }

  let lineCount = 0;
  let replaced = false;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    lineCount = Number(o.line_count ?? 0);
    replaced = Boolean(o.replaced);
  }

  revalidatePath("/uretim-emirleri");
  revalidatePath(`/uretim-emirleri/${orderId}`);
  return { ok: true, lineCount, replaced };
}
