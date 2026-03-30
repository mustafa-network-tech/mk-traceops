import { PartListWithFilters } from "@/components/features/part-list-with-filters";
import {
  assemblyGroupRepository,
  companyRepository,
  materialRepository,
  partRepository,
} from "@/lib/repositories";

export default function AnaParcaListesiPage() {
  const parts = partRepository.getAll();
  const rows = parts.map((part) => ({
    part,
    material: part.materialId
      ? materialRepository.getById(part.materialId)
      : undefined,
    company: part.assignedCompanyId
      ? companyRepository.getById(part.assignedCompanyId)
      : undefined,
    assembly: part.assemblyGroupId
      ? assemblyGroupRepository.getById(part.assemblyGroupId)
      : undefined,
  }));

  return <PartListWithFilters rows={rows} />;
}
