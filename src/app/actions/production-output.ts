"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type RecordProductionOutputResult =
  | { ok: true; quantityProduced: number; status: string }
  | { ok: false; error: string };

export async function recordProductionOutputAction(input: {
  orderId: string;
  goodQty: number;
  locationId: string;
}): Promise<RecordProductionOutputResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase yapılandırılmamış. .env.local içinde URL ve anon anahtar tanımlayın.",
    };
  }

  const gate = await requirePermission("production_orders", "update");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const oid = input.orderId?.trim();
  const loc = input.locationId?.trim();
  const q = Number(input.goodQty);
  if (!oid || !loc) {
    return { ok: false, error: "Emir ve lokasyon gerekli." };
  }
  if (!Number.isFinite(q) || q <= 0) {
    return { ok: false, error: "Miktar pozitif sayı olmalıdır." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_production_output", {
    p_order_id: oid,
    p_good_qty: q,
    p_location_id: loc,
  });

  if (error) {
    return {
      ok: false,
      error: error.message || "Üretim çıkışı kaydedilemedi.",
    };
  }

  let raw: Record<string, unknown> | null = null;
  if (typeof data === "string") {
    try {
      raw = JSON.parse(data) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "Sunucu yanıtı okunamadı." };
    }
  } else if (data && typeof data === "object") {
    raw = data as Record<string, unknown>;
  }
  const quantityProduced = Number(raw?.quantity_produced);
  const status = String(raw?.status ?? "");

  revalidatePath("/uretim-emirleri");
  revalidatePath(`/uretim-emirleri/${oid}`);
  revalidatePath("/urun-stogu");
  revalidatePath("/kokpit");
  revalidatePath("/stok-hareketleri");
  revalidatePath("/mrp");
  revalidatePath("/ham-maddeler");
  revalidatePath("/sarf-malzemeler");

  return {
    ok: true,
    quantityProduced: Number.isFinite(quantityProduced) ? quantityProduced : q,
    status,
  };
}
