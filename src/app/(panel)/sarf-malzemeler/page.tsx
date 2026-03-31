import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  listMaterialCategories,
  listMaterialSupplierRelations,
  listMaterialsByType,
  sumPartQuantitiesByMaterialId,
} from "@/lib/data/supabase-data";

export default async function SarfMalzemelerPage() {
  const [materials, categories, rels, demandByMat] = await Promise.all([
    listMaterialsByType("sarf_malzeme"),
    listMaterialCategories(),
    listMaterialSupplierRelations(),
    sumPartQuantitiesByMaterialId(),
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
        title="Sarf malzemeler"
        description="Kaynak teli, boya, elektrik sarfı, sarf kutuları ve tüketim malzemeleri."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Sarf malzemeler" },
        ]}
      />
      <MaterialTable rows={rows} showPartDemand />
    </div>
  );
}
