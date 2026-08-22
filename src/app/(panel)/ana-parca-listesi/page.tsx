import { PartChildLinksPanel } from "@/components/features/part-child-links-panel";
import { PartListWithFilters } from "@/components/features/part-list-with-filters";
import { getPartsPageData } from "@/lib/services/parts-page-service";
import { hasPermission } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function AnaParcaListesiPage() {
  const ctx = await getRbacSession();
  const { parts, materials, companies, assemblies, childLinks } = await getPartsPageData(ctx);

  const canEditPartBom = hasPermission(ctx, "parts_materials", "update");

  const matById = new Map(materials.map((m) => [m.id, m]));
  const compById = new Map(companies.map((c) => [c.id, c]));
  const agById = new Map(assemblies.map((a) => [a.id, a]));

  const childLinkCountByParent: Record<string, number> = {};
  for (const l of childLinks) {
    childLinkCountByParent[l.parentPartId] =
      (childLinkCountByParent[l.parentPartId] ?? 0) + 1;
  }

  const rows = parts.map((part) => ({
    part,
    material: part.materialId ? matById.get(part.materialId) : undefined,
    company: part.assignedCompanyId
      ? compById.get(part.assignedCompanyId)
      : undefined,
    assembly: part.assemblyGroupId
      ? agById.get(part.assemblyGroupId)
      : undefined,
    childLinkCount: childLinkCountByParent[part.id] ?? 0,
  }));

  return (
    <div>
      <PartListWithFilters rows={rows} />
      <PartChildLinksPanel
        parts={parts}
        links={childLinks}
        canEdit={canEditPartBom}
      />
    </div>
  );
}
