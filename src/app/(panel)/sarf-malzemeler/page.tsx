import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  materialCategoryRepository,
  materialRepository,
  materialSupplierRelationRepository,
} from "@/lib/repositories";

export default function SarfMalzemelerPage() {
  const materials = materialRepository.getByType("sarf_malzeme");
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
        title="Sarf malzemeler"
        description="Kaynak teli, boya, elektrik sarfı, sarf kutuları ve tüketim malzemeleri."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Sarf malzemeler" },
        ]}
      />
      <MaterialTable rows={rows} />
    </div>
  );
}
