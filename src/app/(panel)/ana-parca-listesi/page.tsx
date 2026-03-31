import { PartListWithFilters } from "@/components/features/part-list-with-filters";
import {
  listAssemblyGroups,
  listCompanies,
  listMaterials,
  listParts,
} from "@/lib/data/supabase-data";

export default async function AnaParcaListesiPage() {
  const [parts, materials, companies, assemblies] = await Promise.all([
    listParts(),
    listMaterials(),
    listCompanies(),
    listAssemblyGroups(),
  ]);

  const matById = new Map(materials.map((m) => [m.id, m]));
  const compById = new Map(companies.map((c) => [c.id, c]));
  const agById = new Map(assemblies.map((a) => [a.id, a]));

  const rows = parts.map((part) => ({
    part,
    material: part.materialId ? matById.get(part.materialId) : undefined,
    company: part.assignedCompanyId
      ? compById.get(part.assignedCompanyId)
      : undefined,
    assembly: part.assemblyGroupId
      ? agById.get(part.assemblyGroupId)
      : undefined,
  }));

  return <PartListWithFilters rows={rows} />;
}
