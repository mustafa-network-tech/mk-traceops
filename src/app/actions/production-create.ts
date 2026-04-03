"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CreateDraftProductionOrderResult =
  | { ok: true; orderId: string; orderNo: string }
  | { ok: false; error: string };

export async function createDraftProductionOrderAction(input: {
  orderNo: string;
  productId: string;
  quantityPlanned: number;
  scheduledDate: string;
  departmentId: string;
  assemblyGroupId?: string | null;
  notes?: string | null;
}): Promise<CreateDraftProductionOrderResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Supabase yapılandırılmamış.",
    };
  }

  const gate = await requirePermission("production_orders", "create");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const orderNo = input.orderNo?.trim();
  if (!orderNo) {
    return { ok: false, error: "Emir numarası gerekli." };
  }
  const productId = input.productId?.trim();
  const departmentId = input.departmentId?.trim();
  if (!productId || !departmentId) {
    return { ok: false, error: "Ürün ve bölüm seçilmelidir." };
  }

  const qty = Number(input.quantityPlanned);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, error: "Planlanan miktar pozitif olmalıdır." };
  }

  const scheduledDate = input.scheduledDate?.trim();
  if (!scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { ok: false, error: "Geçerli plan tarihi (YYYY-AA-GG) girin." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_draft_production_order", {
    p_order_no: orderNo,
    p_product_id: productId,
    p_quantity_planned: qty,
    p_scheduled_date: scheduledDate,
    p_department_id: departmentId,
    p_assembly_group_id: input.assemblyGroupId?.trim() || null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    return {
      ok: false,
      error: error.message || "Emir oluşturulamadı.",
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

  const orderId = String(raw?.id ?? "");
  const no = String(raw?.order_no ?? orderNo);
  if (!orderId) {
    return { ok: false, error: "Emir kimliği alınamadı." };
  }

  revalidatePath("/uretim-emirleri");
  revalidatePath(`/uretim-emirleri/${orderId}`);
  revalidatePath("/kokpit");
  revalidatePath("/mrp");

  return { ok: true, orderId, orderNo: no };
}
