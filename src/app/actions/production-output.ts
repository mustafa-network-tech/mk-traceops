"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/d1/database";
import { ProductionRepository } from "@/lib/d1/repositories/production";
import { requirePermission } from "@/lib/rbac/action-gate";
export type RecordProductionOutputResult = { ok: true; quantityProduced: number; status: string } | { ok: false; error: string };
export async function recordProductionOutputAction(input: { orderId: string; goodQty: number; locationId: string }): Promise<RecordProductionOutputResult> {
  const gate = await requirePermission("production_orders", "update"); if (!gate.ok) return { ok: false, error: gate.error };
  const orderId = input.orderId?.trim(); const locationId = input.locationId?.trim(); const goodQty = Number(input.goodQty); if (!orderId || !locationId || !(goodQty > 0)) return { ok: false, error: "Emir, lokasyon ve pozitif miktar gereklidir." };
  try { const result = await new ProductionRepository(getDatabase(), { factoryId: gate.ctx.user.factoryId!, actorId: gate.ctx.user.id }).recordOutput(orderId, goodQty, locationId); for (const path of ["/uretim-emirleri", `/uretim-emirleri/${orderId}`, "/urun-stogu", "/kokpit", "/stok-hareketleri", "/mrp", "/ham-maddeler", "/sarf-malzemeler"]) revalidatePath(path); return { ok: true, ...result }; }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Üretim çıkışı kaydedilemedi." }; }
}
