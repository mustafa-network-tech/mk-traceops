import { ReportsSection } from "@/components/features/reports-section";
import {
  listAssemblyGroups,
  listMaterials,
  listProducts,
  listSuppliers,
} from "@/lib/data/supabase-data";

export default async function RaporlamaPage() {
  const [materials, suppliers, products, assemblies] = await Promise.all([
    listMaterials(),
    listSuppliers(),
    listProducts(),
    listAssemblyGroups(),
  ]);

  return (
    <ReportsSection
      materials={materials}
      suppliers={suppliers}
      products={products}
      assemblies={assemblies}
    />
  );
}
