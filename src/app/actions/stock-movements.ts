"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/d1/database";
import { StockRepository } from "@/lib/d1/repositories/stock";
import { requirePermission } from "@/lib/rbac/action-gate";
import type { StockMovementType } from "@/lib/types/models";
const TYPES: StockMovementType[] = ["giriş", "çıkış", "üretimde_kullanım", "iade", "fire", "manuel_düzeltme"];
export type CreateStockMovementInput = { materialId: string; type: StockMovementType; quantity: number; unit?: string; occurredAt: string; locationId: string; productionOrderId?: string | null; assemblyGroupId?: string | null; supplierId?: string | null; projectReference?: string | null; note?: string | null };
export type CreateStockMovementResult = { ok: true; movementId: string } | { ok: false; error: string };
export async function createStockMovementAction(input: CreateStockMovementInput): Promise<CreateStockMovementResult> {
  const gate = await requirePermission("stock_movements", "create"); if (!gate.ok) return { ok: false, error: gate.error };
  if (!TYPES.includes(input.type)) return { ok: false, error: "Geçersiz hareket tipi." };
  const quantity = Number(input.quantity); if (!input.materialId?.trim() || !input.locationId?.trim() || !Number.isFinite(quantity) || quantity === 0) return { ok: false, error: "Malzeme, lokasyon ve geçerli miktar gereklidir." };
  let occurredAt = input.occurredAt?.trim(); const date = new Date(occurredAt); if (!occurredAt || Number.isNaN(date.getTime())) return { ok: false, error: "Geçersiz tarih/saat." }; occurredAt = date.toISOString();
  try {
    const movementId = await new StockRepository(getDatabase(), { factoryId: gate.ctx.user.factoryId!, actorId: gate.ctx.user.id }).apply({ materialId: input.materialId.trim(), locationId: input.locationId.trim(), type: input.type, quantity: Math.abs(quantity), unit: input.unit?.trim() || "adet", occurredAt, productionOrderId: input.productionOrderId?.trim() || null, assemblyGroupId: input.assemblyGroupId?.trim() || null, supplierId: input.supplierId?.trim() || null, projectReference: input.projectReference?.trim() || null, note: input.note?.trim() || null });
    for (const path of ["/stok-hareketleri", "/kokpit", "/ham-maddeler", "/sarf-malzemeler", "/malzeme-yonetimi"]) revalidatePath(path); return { ok: true, movementId };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Stok hareketi kaydedilemedi." }; }
}
