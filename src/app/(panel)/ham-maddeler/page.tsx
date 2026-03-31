import { PageHeader } from "@/components/layout/page-header";
import { MaterialTable } from "@/components/features/material-table";
import {
  listMaterialCategories,
  listMaterialSupplierRelations,
  listMaterialsByType,
  sumPartQuantitiesByMaterialId,
} from "@/lib/data/supabase-data";

export default async function HamMaddelerPage() {
  const [materials, categories, rels, demandByMat] = await Promise.all([
    listMaterialsByType("ham_madde"),
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
    partDemandQty: demandByMat.get(m.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Ham maddeler"
        description="Levha, profil, boru vb. Parça talebi: Excel’deki Adet alanlarının bu malzeme için toplamı. Mevcut sütunu depo stoğudur."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ham maddeler" },
        ]}
      />
      <MaterialTable rows={rows} showPartDemand />
    </div>
  );
}
