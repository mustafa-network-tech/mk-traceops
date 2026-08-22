import { createId, nowIso, type Database } from "../database";
import { TenantRepository, type TenantContext } from "../tenant-repository";

type MovementInput = {
  materialId: string; locationId: string; type: "giriş" | "çıkış" | "üretimde_kullanım" | "iade" | "fire" | "manuel_düzeltme";
  quantity: number; unit: string; occurredAt?: string; note?: string | null;
};

export class StockRepository extends TenantRepository {
  constructor(db: Database, tenant: TenantContext) { super(db, tenant); }

  async apply(input: MovementInput): Promise<string> {
    if (!(input.quantity > 0)) throw new Error("Miktar pozitif olmalıdır.");
    const material = await this.tenantStatement(
      "SELECT id,current_stock FROM materials WHERE factory_id=? AND id=?", input.materialId,
    ).first<{ id: string; current_stock: number }>();
    const location = await this.tenantStatement(
      "SELECT id FROM locations WHERE factory_id=? AND id=?", input.locationId,
    ).first<{ id: string }>();
    if (!material || !location) throw new Error("Malzeme veya lokasyon bu fabrikaya ait değil.");

    const signed = ["giriş", "iade"].includes(input.type) ? input.quantity : -input.quantity;
    const next = material.current_stock + signed;
    if (next < 0) throw new Error("Yetersiz stok.");
    const id = createId();
    const now = nowIso();
    // D1 batch is atomic: either both prepared statements commit or neither does.
    await this.db.batch([
      this.tenantStatement("UPDATE materials SET current_stock=?2,updated_at=?3 WHERE factory_id=?1 AND id=?4", next, now, input.materialId),
      this.tenantStatement(
        `INSERT INTO stock_movements
         (factory_id,id,material_id,type,quantity,unit,occurred_at,location_id,note,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        id, input.materialId, input.type, input.quantity, input.unit,
        input.occurredAt ?? now, input.locationId, input.note ?? null, now,
      ),
    ]);
    return id;
  }
}
