"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/d1/database";
import { ProductionRepository } from "@/lib/d1/repositories/production";
import { requirePermission } from "@/lib/rbac/action-gate";
export type CreateDraftProductionOrderResult = { ok: true; orderId: string; orderNo: string } | { ok: false; error: string };
export async function createDraftProductionOrderAction(input: { orderNo: string; productId: string; quantityPlanned: number; scheduledDate: string; departmentId: string; assemblyGroupId?: string | null; notes?: string | null }): Promise<CreateDraftProductionOrderResult> {
  const gate = await requirePermission("production_orders", "create"); if (!gate.ok) return { ok: false, error: gate.error };
  const orderNo = input.orderNo?.trim(); const productId = input.productId?.trim(); const departmentId = input.departmentId?.trim(); const quantityPlanned = Number(input.quantityPlanned); const scheduledDate = input.scheduledDate?.trim();
  if (!orderNo || !productId || !departmentId) return { ok: false, error: "Emir numarası, ürün ve bölüm gereklidir." };
  if (!(quantityPlanned > 0)) return { ok: false, error: "Planlanan miktar pozitif olmalıdır." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return { ok: false, error: "Geçerli plan tarihi girin." };
  try {
    const orderId = await new ProductionRepository(getDatabase(), { factoryId: gate.ctx.user.factoryId!, actorId: gate.ctx.user.id }).createDraft({ orderNo, productId, departmentId, quantityPlanned, scheduledDate, assemblyGroupId: input.assemblyGroupId?.trim() || null, notes: input.notes?.trim() || null });
    revalidatePath("/uretim-emirleri"); revalidatePath(`/uretim-emirleri/${orderId}`); revalidatePath("/kokpit"); revalidatePath("/mrp"); return { ok: true, orderId, orderNo };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Emir oluşturulamadı." }; }
}
