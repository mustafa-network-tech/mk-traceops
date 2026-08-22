import { createId, nowIso, type Database } from "../database";
import { BomRepository } from "./bom";
import { TenantRepository, type TenantContext } from "../tenant-repository";

type OrderRow = {
  id: string; product_id: string; status: string; quantity_planned: number;
  quantity_produced: number; approved_at: string | null;
};

export class ProductionRepository extends TenantRepository {
  constructor(db: Database, tenant: TenantContext) { super(db, tenant); }

  async createDraft(input: { orderNo: string; productId: string; quantityPlanned: number; scheduledDate: string; departmentId: string; assemblyGroupId?: string | null; notes?: string | null }): Promise<string> {
    const [product, department, group] = await Promise.all([
      this.tenantStatement("SELECT id FROM products WHERE factory_id=? AND id=?", input.productId).first(),
      this.tenantStatement("SELECT id FROM departments WHERE factory_id=? AND id=?", input.departmentId).first(),
      input.assemblyGroupId ? this.tenantStatement("SELECT id FROM assembly_groups WHERE factory_id=? AND id=?", input.assemblyGroupId).first() : Promise.resolve({ id: null }),
    ]);
    if (!product || !department || (input.assemblyGroupId && !group)) throw new Error("Ürün, bölüm veya montaj grubu bu fabrikaya ait değil.");
    const id = createId();
    await this.tenantStatement(
      `INSERT INTO production_orders (factory_id,id,order_no,product_id,assembly_group_id,status,quantity_planned,quantity_produced,scheduled_date,department_id,notes,created_at)
       VALUES (?,?,?,?,?,'taslak',?,0,?,?,?,?)`,
      id, input.orderNo, input.productId, input.assemblyGroupId ?? null, input.quantityPlanned,
      input.scheduledDate, input.departmentId, input.notes ?? null, nowIso(),
    ).run();
    return id;
  }

  async approve(orderId: string): Promise<string> {
    const now = nowIso();
    const result = await this.tenantStatement(
      "UPDATE production_orders SET status='planlandı',approved_at=?2,approved_by=?3 WHERE factory_id=?1 AND id=?4 AND status='taslak'",
      now, this.tenant.actorId, orderId,
    ).run();
    if (result.meta.changes !== 1) throw new Error("Yalnızca taslak emir onaylanabilir.");
    return "planlandı";
  }

  async cancel(orderId: string): Promise<string> {
    const result = await this.tenantStatement(
      "UPDATE production_orders SET status='iptal' WHERE factory_id=? AND id=? AND status IN ('taslak','planlandı')",
      orderId,
    ).run();
    if (result.meta.changes !== 1) throw new Error("Emir iptal edilemedi.");
    return "iptal";
  }

  async fillLinesFromBom(orderId: string, replace: boolean): Promise<{ lineCount: number; replaced: boolean }> {
    const order = await this.tenantStatement(
      "SELECT id,product_id,status,quantity_planned,quantity_produced,approved_at FROM production_orders WHERE factory_id=? AND id=?",
      orderId,
    ).first<OrderRow>();
    if (!order || ["iptal", "tamamlandı"].includes(order.status)) throw new Error("Emir BOM işlemine kapalı.");
    const existing = await this.statement("SELECT COUNT(*) AS count FROM production_order_lines WHERE production_order_id=?", orderId).first<{ count: number }>();
    if ((existing?.count ?? 0) > 0 && !replace) throw new Error("Emirde zaten malzeme satırı var.");
    const part = await this.tenantStatement(
      `SELECT p.id FROM parts p JOIN products product ON product.factory_id=p.factory_id
       WHERE p.factory_id=? AND product.id=? AND (p.part_code=product.code OR p.description=product.name) ORDER BY p.part_code LIMIT 1`,
      order.product_id,
    ).first<{ id: string }>();
    if (!part) throw new Error("Ürünle eşleşen BOM parçası bulunamadı.");
    const exploded = await new BomRepository(this.db, this.tenant).explode(part.id, order.quantity_planned);
    const statements: D1PreparedStatement[] = [];
    if (replace) statements.push(this.statement("DELETE FROM production_order_lines WHERE production_order_id=?", orderId));
    const now = nowIso();
    for (const row of exploded) statements.push(this.statement(
      "INSERT INTO production_order_lines (id,production_order_id,material_id,quantity_used,unit,note,created_at) VALUES (?,?,?,?,?,NULL,?)",
      createId(), orderId, row.materialId, row.quantity, row.unit, now,
    ));
    if (statements.length) await this.db.batch(statements);
    return { lineCount: exploded.length, replaced: replace && (existing?.count ?? 0) > 0 };
  }

  async recordOutput(orderId: string, goodQty: number, locationId: string): Promise<{ quantityProduced: number; status: string }> {
    const order = await this.tenantStatement(
      "SELECT id,product_id,status,quantity_planned,quantity_produced,approved_at FROM production_orders WHERE factory_id=? AND id=?",
      orderId,
    ).first<OrderRow>();
    if (!order || !order.approved_at || !["planlandı", "üretimde"].includes(order.status)) throw new Error("Emir üretim çıkışına açık değil.");
    const location = await this.tenantStatement("SELECT id FROM locations WHERE factory_id=? AND id=?", locationId).first();
    if (!location) throw new Error("Lokasyon bu fabrikaya ait değil.");
    const next = order.quantity_produced + goodQty;
    const status = next >= order.quantity_planned ? "tamamlandı" : "üretimde";
    const stock = await this.statement("SELECT id,current_stock FROM product_stock_items WHERE product_id=? AND location_id=?", order.product_id, locationId).first<{ id: string; current_stock: number }>();
    const now = nowIso();
    const statements = [this.tenantStatement("UPDATE production_orders SET quantity_produced=?2,status=?3 WHERE factory_id=?1 AND id=?4", next, status, orderId)];
    if (stock) statements.push(this.statement("UPDATE product_stock_items SET current_stock=?,last_production_date=? WHERE id=?", stock.current_stock + goodQty, now, stock.id));
    else statements.push(this.statement("INSERT INTO product_stock_items (id,product_id,current_stock,last_production_date,location_id,created_at) VALUES (?,?,?,?,?,?)", createId(), order.product_id, goodQty, now, locationId, now));
    await this.db.batch(statements);
    return { quantityProduced: next, status };
  }
}
