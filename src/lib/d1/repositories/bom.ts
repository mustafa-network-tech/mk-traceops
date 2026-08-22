import type { Database } from "../database";
import { TenantRepository, type TenantContext } from "../tenant-repository";

export type ExplodedMaterial = { materialId: string; quantity: number; unit: string };

export class BomRepository extends TenantRepository {
  constructor(db: Database, tenant: TenantContext) { super(db, tenant); }

  async explode(rootPartId: string, quantity: number, maxDepth = 24): Promise<ExplodedMaterial[]> {
    if (!(quantity > 0) || maxDepth < 0 || maxDepth > 64) throw new Error("Geçersiz BOM miktarı/derinliği.");
    const result = await this.tenantStatement(
      `WITH RECURSIVE bom_tree(part_id, cumulative_qty, depth, path) AS (
         SELECT id, ?2, 0, '/' || id || '/'
         FROM parts WHERE factory_id = ?1 AND id = ?3
         UNION ALL
         SELECT child.id, tree.cumulative_qty * edge.quantity_per_parent,
                tree.depth + 1, tree.path || child.id || '/'
         FROM bom_tree tree
         JOIN part_child_parts edge ON edge.parent_part_id = tree.part_id
         JOIN parts child ON child.id = edge.child_part_id AND child.factory_id = ?1
         WHERE tree.depth < ?4 AND instr(tree.path, '/' || child.id || '/') = 0
       )
       SELECT req.material_id AS materialId,
              SUM(req.quantity_per_unit * tree.cumulative_qty) AS quantity,
              MAX(req.unit) AS unit
       FROM bom_tree tree
       JOIN part_material_requirements req ON req.part_id = tree.part_id
       JOIN materials mat ON mat.id = req.material_id AND mat.factory_id = ?1
       GROUP BY req.material_id HAVING quantity > 0`,
      quantity, rootPartId, maxDepth,
    ).all<ExplodedMaterial>();
    return result.results;
  }
}
