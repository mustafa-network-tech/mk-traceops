import { createId, nowIso, type Database } from "../database";
import { TenantRepository, type TenantContext } from "../tenant-repository";

export type MaterialRow = {
  id: string; factory_id: string; code: string; name: string; type: string;
  unit: string; min_stock: number; current_stock: number; active: number;
  category_id: string; note: string | null; created_at: string; updated_at: string;
};

export class MaterialsRepository extends TenantRepository {
  constructor(db: Database, tenant: TenantContext) { super(db, tenant); }

  async list(): Promise<MaterialRow[]> {
    const result = await this.tenantStatement(
      "SELECT * FROM materials WHERE factory_id = ? ORDER BY code",
    ).all<MaterialRow>();
    return result.results;
  }

  async find(id: string): Promise<MaterialRow | null> {
    return this.tenantStatement(
      "SELECT * FROM materials WHERE factory_id = ? AND id = ? LIMIT 1", id,
    ).first<MaterialRow>();
  }

  async create(input: Omit<MaterialRow, "id" | "factory_id" | "created_at" | "updated_at">): Promise<string> {
    const id = createId();
    const now = nowIso();
    await this.tenantStatement(
      `INSERT INTO materials
       (factory_id,id,code,name,type,unit,min_stock,current_stock,active,category_id,note,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, input.code, input.name, input.type, input.unit, input.min_stock,
      input.current_stock, input.active, input.category_id, input.note, now, now,
    ).run();
    return id;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.tenantStatement(
      "DELETE FROM materials WHERE factory_id = ? AND id = ?", id,
    ).run();
    return result.meta.changes === 1;
  }
}
