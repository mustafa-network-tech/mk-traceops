import { StockMovementFilters } from "@/components/features/stock-movement-filters";
import {
  listAssemblyGroups,
  listLocations,
  listMaterials,
  listStockMovements,
} from "@/lib/data/supabase-data";

export default async function StokHareketleriPage() {
  const [movements, materials, locations, assemblies] = await Promise.all([
    listStockMovements(),
    listMaterials(),
    listLocations(),
    listAssemblyGroups(),
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

  return <StockMovementFilters rows={rows} />;
}
