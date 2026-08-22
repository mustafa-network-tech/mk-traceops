import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  listMaterialCategories,
  listMaterialSupplierRelations,
  listMaterialsByType,
} from "@/lib/data/d1-data";

export default async function HamMaddelerPage() {
  const [materials, categories, rels] = await Promise.all([
    listMaterialsByType("ham_madde"),
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
        title="Ham maddeler"
        description="Levha, profil, boru vb. Mevcut ve Min. stok, depodaki miktarları gösterir (Excel ham madde sayfası / el ile güncelleme)."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ham maddeler" },
        ]}
      />
      <MaterialTable rows={rows} />
    </div>
  );
}
