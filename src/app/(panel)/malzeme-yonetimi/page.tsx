import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  materialCategoryRepository,
  materialRepository,
  materialSupplierRelationRepository,
} from "@/lib/repositories";

export default function MalzemeYonetimiPage() {
  const materials = materialRepository.getAll();
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
        title="Malzeme yönetimi"
        description="Ham madde ve sarf malzemelerin birleşik görünümü: stok, kategori, tedarikçi ilişki sayısı ve kritik uyarılar."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Malzeme" },
        ]}
      />
      <MaterialTable rows={rows} />
    </div>
  );
}
