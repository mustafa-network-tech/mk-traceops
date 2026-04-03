import { StockMovementFilters } from "@/components/features/stock-movement-filters";
import { StockMovementForm } from "@/components/features/stock-movement-form";
import {
  listAssemblyGroups,
  listLocations,
  listMaterials,
  listProductionOrders,
  listStockMovements,
  listSuppliers,
} from "@/lib/data/supabase-data";
import { hasPermission } from "@/lib/rbac/helpers";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function StokHareketleriPage() {
  await requirePanelModule("stock_movements", "read");
  const ctx = await getRbacSession();
  const canCreate = hasPermission(ctx, "stock_movements", "create");
  const canReadProductionOrders = hasPermission(ctx, "production_orders", "read");

  const [movements, materials, locations, assemblies, suppliers, orders] =
    await Promise.all([
      listStockMovements(),
      listMaterials(),
      listLocations(),
      listAssemblyGroups(),
      listSuppliers(),
      canReadProductionOrders ? listProductionOrders() : Promise.resolve([]),
    ]);

  const matById = new Map(materials.map((m) => [m.id, m]));
  const locById = new Map(locations.map((l) => [l.id, l]));
  const agById = new Map(assemblies.map((a) => [a.id, a]));

  const rows = movements.map((movement) => ({
    movement,
    material: matById.get(movement.materialId),
    location: locById.get(movement.locationId),
    assembly: movement.assemblyGroupId
      ? agById.get(movement.assemblyGroupId)
      : undefined,
  }));

  return (
    <div>
      {canCreate ? (
        <StockMovementForm
          materials={materials}
          locations={locations}
          suppliers={suppliers}
          productionOrders={orders}
          assemblies={assemblies}
        />
      ) : null}
      <StockMovementFilters rows={rows} />
    </div>
  );
}
