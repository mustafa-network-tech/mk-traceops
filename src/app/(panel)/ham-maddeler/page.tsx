import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  materialCategoryRepository,
  materialRepository,
  materialSupplierRelationRepository,
} from "@/lib/repositories";

export default function HamMaddelerPage() {
  const materials = materialRepository.getByType("ham_madde");
  const rows = materials.map((m) => ({
    material: m,
    categoryName:
      materialCategoryRepository.getById(m.categoryId)?.name ?? m.categoryId,
    supplierCount: materialSupplierRelationRepository.getByMaterialId(m.id)
      .length,
    critical: m.currentStock <= m.minStock,
  }));

  return (
    <div>
      <PageHeader
        title="Ham maddeler"
        description="Levha, profil, boru vb. ana stok kalemleri."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ham maddeler" },
        ]}
      />
      <MaterialTable rows={rows} />
    </div>
  );
}
