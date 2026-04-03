"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ProductionApprovalResult =
  | { ok: true; status: string }
  | { ok: false; error: string };

function parseRpcStatus(data: unknown): string {
  if (typeof data === "string") {
    try {
      const o = JSON.parse(data) as Record<string, unknown>;
      return String(o?.status ?? "");
    } catch {
      return "";
    }
  }
  if (data && typeof data === "object" && "status" in data) {
    return String((data as Record<string, unknown>).status ?? "");
  }
  return "";
}

export async function approveDraftProductionOrderAction(
  orderId: string,
): Promise<ProductionApprovalResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Supabase yapılandırılmamış.",
    };
  }
  const gate = await requirePermission("production_orders", "update");
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = orderId?.trim();
  if (!id) return { ok: false, error: "Emir seçilmedi." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("approve_production_order", {
    p_order_id: id,
  });

  if (error) {
    return { ok: false, error: error.message || "Onaylanamadı." };
  }

  revalidatePath("/uretim-emirleri");
  revalidatePath(`/uretim-emirleri/${id}`);
  revalidatePath("/mrp");
  revalidatePath("/kokpit");

  return { ok: true, status: parseRpcStatus(data) || "planlandı" };
}

export async function cancelDraftProductionOrderAction(
  orderId: string,
): Promise<ProductionApprovalResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Supabase yapılandırılmamış.",
    };
  }
  const gate = await requirePermission("production_orders", "update");
  if (!gate.ok) return { ok: false, error: gate.error };

  const id = orderId?.trim();
  if (!id) return { ok: false, error: "Emir seçilmedi." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cancel_draft_production_order", {
    p_order_id: id,
  });

  if (error) {
    return { ok: false, error: error.message || "İptal edilemedi." };
  }

  revalidatePath("/uretim-emirleri");
  revalidatePath(`/uretim-emirleri/${id}`);
  revalidatePath("/kokpit");

  return { ok: true, status: parseRpcStatus(data) || "iptal" };
}
