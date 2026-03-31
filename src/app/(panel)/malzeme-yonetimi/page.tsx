import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  listMaterialCategories,
  listMaterialSupplierRelations,
  listMaterials,
} from "@/lib/data/supabase-data";

export default async function MalzemeYonetimiPage() {
  const [materials, categories, rels] = await Promise.all([
    listMaterials(),
    listMaterialCategories(),
    listMaterialSupplierRelations(),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const countByMat = new Map<string, number>();
  for (const r of rels) {
    countByMat.set(
      r.materialId,
      (countByMat.get(r.materialId) ?? 0) + 1,
    );
  }

  const rows = materials.map((m) => ({
    material: m,
    categoryName: catById.get(m.categoryId)?.name ?? m.categoryId,
    supplierCount: countByMat.get(m.id) ?? 0,
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
