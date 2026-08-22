"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/d1/database";
import { ProductionRepository } from "@/lib/d1/repositories/production";
import { requirePermission } from "@/lib/rbac/action-gate";
export type FillProductionOrderBomResult = { ok: true; lineCount: number; replaced: boolean } | { ok: false; error: string };
export async function fillProductionOrderLinesFromBomAction(input: { orderId: string; replaceExisting: boolean }): Promise<FillProductionOrderBomResult> {
  const gate = await requirePermission("production_orders", "update"); if (!gate.ok) return { ok: false, error: gate.error }; const orderId = input.orderId?.trim(); if (!orderId) return { ok: false, error: "Emir seçilmedi." };
  try { const result = await new ProductionRepository(getDatabase(), { factoryId: gate.ctx.user.factoryId!, actorId: gate.ctx.user.id }).fillLinesFromBom(orderId, Boolean(input.replaceExisting)); revalidatePath("/uretim-emirleri"); revalidatePath(`/uretim-emirleri/${orderId}`); return { ok: true, ...result }; }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "BOM satırları yazılamadı." }; }
}
