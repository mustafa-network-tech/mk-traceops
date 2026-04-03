"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/rbac/action-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { StockMovementType } from "@/lib/types/models";

const TYPES: StockMovementType[] = [
  "giriş",
  "çıkış",
  "üretimde_kullanım",
  "iade",
  "fire",
  "manuel_düzeltme",
];

export type CreateStockMovementInput = {
  materialId: string;
  type: StockMovementType;
  /** Pozitif; manuel_düzeltme için artış/azalış (negatif olabilir). */
  quantity: number;
  unit?: string;
  /** ISO veya datetime-local uyumlu string */
  occurredAt: string;
  locationId: string;
  productionOrderId?: string | null;
  assemblyGroupId?: string | null;
  supplierId?: string | null;
  projectReference?: string | null;
  note?: string | null;
};

export type CreateStockMovementResult =
  | { ok: true; movementId: string }
  | { ok: false; error: string };

export async function createStockMovementAction(
  input: CreateStockMovementInput,
): Promise<CreateStockMovementResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase yapılandırılmamış. .env.local içinde URL ve anon anahtar tanımlayın.",
    };
  }

  const gate = await requirePermission("stock_movements", "create");
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  if (!TYPES.includes(input.type)) {
    return { ok: false, error: "Geçersiz hareket tipi." };
  }

  if (!input.materialId?.trim() || !input.locationId?.trim()) {
    return { ok: false, error: "Malzeme ve lokasyon seçilmelidir." };
  }

  const qty = Number(input.quantity);
  if (!Number.isFinite(qty)) {
    return { ok: false, error: "Miktar sayı olmalıdır." };
  }

  if (input.type === "manuel_düzeltme") {
    if (qty === 0) {
      return { ok: false, error: "Manuel düzeltmede miktar sıfır olamaz." };
    }
  } else if (qty <= 0) {
    return { ok: false, error: "Bu hareket tipinde miktar pozitif olmalıdır." };
  }

  let occurredAtIso = input.occurredAt?.trim();
  if (!occurredAtIso) {
    return { ok: false, error: "Tarih/saat girilmelidir." };
  }
  if (!occurredAtIso.includes("T") && occurredAtIso.length === 16) {
    occurredAtIso = `${occurredAtIso}:00`;
  }
  if (!occurredAtIso.includes("Z") && !occurredAtIso.match(/[+-]\d{2}:\d{2}$/)) {
    const d = new Date(occurredAtIso);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "Geçersiz tarih/saat." };
    }
    occurredAtIso = d.toISOString();
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("apply_stock_movement", {
    p_material_id: input.materialId.trim(),
    p_type: input.type,
    p_quantity: qty,
    p_unit: input.unit?.trim() ?? "",
    p_occurred_at: occurredAtIso,
    p_location_id: input.locationId.trim(),
    p_production_order_id: input.productionOrderId?.trim() || null,
    p_assembly_group_id: input.assemblyGroupId?.trim() || null,
    p_project_reference: input.projectReference?.trim() || null,
    p_note: input.note?.trim() || null,
    p_supplier_id: input.supplierId?.trim() || null,
  });

  if (error) {
    return {
      ok: false,
      error: error.message || "Stok hareketi kaydedilemedi.",
    };
  }

  const movementId = data as string;
  revalidatePath("/stok-hareketleri");
  revalidatePath("/kokpit");
  revalidatePath("/ham-maddeler");
  revalidatePath("/sarf-malzemeler");
  revalidatePath("/malzeme-yonetimi");

  return { ok: true, movementId };
}
