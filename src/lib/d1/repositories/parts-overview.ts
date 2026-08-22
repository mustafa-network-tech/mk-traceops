import "server-only";

import type { AssemblyGroup, Company, Material, Part, PartChildPart } from "@/lib/types/models";
import { createId, nowIso, type Database } from "../database";
import { TenantRepository, type TenantContext } from "../tenant-repository";

type Row = Record<string, unknown>;
const optional = (value: unknown) => value == null ? undefined : String(value);

export class PartsOverviewRepository extends TenantRepository {
  constructor(db: Database, tenant: TenantContext) { super(db, tenant); }

  async listParts(): Promise<Part[]> {
    const rows = await this.tenantStatement(
      "SELECT * FROM parts WHERE factory_id=? ORDER BY part_code,id",
    ).all<Row>();
    return rows.results.map((r) => ({
      id: String(r.id), importBatchId: optional(r.import_batch_id), partCode: String(r.part_code),
      description: String(r.description ?? ""), materialId: optional(r.material_id),
      dimensions: optional(r.dimensions), quantity: Number(r.quantity ?? 0),
      operation: String(r.operation ?? ""), assignedCompanyId: optional(r.assigned_company_id),
      assemblyGroupId: optional(r.assembly_group_id), type: r.type as Part["type"],
      importRowId: optional(r.import_row_id),
    }));
  }

  async listMaterials(): Promise<Material[]> {
    const rows = await this.tenantStatement(
      "SELECT * FROM materials WHERE factory_id=? ORDER BY code,id",
    ).all<Row>();
    return rows.results.map((r) => ({
      id: String(r.id), code: String(r.code), name: String(r.name), type: r.type as Material["type"],
      unit: String(r.unit), minStock: Number(r.min_stock ?? 0), currentStock: Number(r.current_stock ?? 0),
      active: Boolean(r.active), categoryId: String(r.category_id), note: optional(r.note),
      sourceImportBatchId: optional(r.source_import_batch_id),
    }));
  }

  async listCompanies(): Promise<Company[]> {
    const rows = await this.tenantStatement(
      "SELECT * FROM companies WHERE factory_id=? ORDER BY name,id",
    ).all<Row>();
    return rows.results.map((r) => ({
      id: String(r.id), name: String(r.name), taxNumber: optional(r.tax_number),
      isExternalManufacturer: Boolean(r.is_external_manufacturer), contactPhone: optional(r.contact_phone),
      city: optional(r.city), notes: optional(r.notes),
    }));
  }

  async listAssemblyGroups(): Promise<AssemblyGroup[]> {
    const rows = await this.tenantStatement(
      "SELECT * FROM assembly_groups WHERE factory_id=? ORDER BY code,id",
    ).all<Row>();
    return rows.results.map((r) => ({
      id: String(r.id), code: String(r.code), name: String(r.name),
      projectReference: optional(r.project_reference), importBatchId: optional(r.import_batch_id),
      notes: optional(r.notes),
    }));
  }

  async listChildLinks(): Promise<PartChildPart[]> {
    const rows = await this.tenantStatement(
      `SELECT link.* FROM part_child_parts link
       JOIN parts parent ON parent.id=link.parent_part_id
       JOIN parts child ON child.id=link.child_part_id AND child.factory_id=parent.factory_id
       WHERE parent.factory_id=? ORDER BY link.parent_part_id,link.id`,
    ).all<Row>();
    return rows.results.map((r) => ({
      id: String(r.id), parentPartId: String(r.parent_part_id), childPartId: String(r.child_part_id),
      quantityPerParent: Number(r.quantity_per_parent), unit: String(r.unit || "adet"), note: optional(r.note),
    }));
  }

  async addChildLink(parentPartId: string, childPartId: string, quantity: number): Promise<void> {
    const result = await this.tenantStatement(
      `INSERT INTO part_child_parts(id,parent_part_id,child_part_id,quantity_per_parent,unit,created_at)
       SELECT ?2,?3,?4,?5,'adet',?6
       WHERE EXISTS(SELECT 1 FROM parts WHERE factory_id=?1 AND id=?3)
         AND EXISTS(SELECT 1 FROM parts WHERE factory_id=?1 AND id=?4)`,
      createId(), parentPartId, childPartId, quantity, nowIso(),
    ).run();
    if (result.meta.changes !== 1) throw new Error("Parçalar bu fabrikaya ait değil.");
  }

  async deleteChildLink(id: string): Promise<boolean> {
    const result = await this.tenantStatement(
      `DELETE FROM part_child_parts
       WHERE id=?2 AND EXISTS(
         SELECT 1 FROM parts p
         WHERE p.id=part_child_parts.parent_part_id AND p.factory_id=?1
       )`, id,
    ).run();
    return result.meta.changes === 1;
  }
}
