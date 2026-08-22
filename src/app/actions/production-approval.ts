"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/d1/database";
import { ProductionRepository } from "@/lib/d1/repositories/production";
import { requirePermission } from "@/lib/rbac/action-gate";
export type ProductionApprovalResult = { ok: true; status: string } | { ok: false; error: string };
async function mutate(orderId: string, operation: "approve" | "cancel"): Promise<ProductionApprovalResult> {
  const gate = await requirePermission("production_orders", "update"); if (!gate.ok) return { ok: false, error: gate.error };
  const id = orderId?.trim(); if (!id) return { ok: false, error: "Emir seçilmedi." };
  try { const repo = new ProductionRepository(getDatabase(), { factoryId: gate.ctx.user.factoryId!, actorId: gate.ctx.user.id }); const status = operation === "approve" ? await repo.approve(id) : await repo.cancel(id); revalidatePath("/uretim-emirleri"); revalidatePath(`/uretim-emirleri/${id}`); revalidatePath("/mrp"); revalidatePath("/kokpit"); return { ok: true, status }; }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Emir güncellenemedi." }; }
}
export async function approveDraftProductionOrderAction(orderId: string) { return mutate(orderId, "approve"); }
export async function cancelDraftProductionOrderAction(orderId: string) { return mutate(orderId, "cancel"); }
