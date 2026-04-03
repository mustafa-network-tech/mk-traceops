import { ReportsSection } from "@/components/features/reports-section";
import { hasPermission } from "@/lib/rbac/helpers";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { getRbacSession } from "@/lib/rbac/session-server";
import {
  listAssemblyGroups,
  listMaterials,
  listProducts,
  listSuppliers,
} from "@/lib/data/supabase-data";

export default async function RaporlamaPage() {
  await requirePanelModule("reports", "read");
  const ctx = await getRbacSession();
  const canReadProductionOrders = hasPermission(ctx, "production_orders", "read");

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
      canReadProductionOrders={canReadProductionOrders}
    />
  );
}
