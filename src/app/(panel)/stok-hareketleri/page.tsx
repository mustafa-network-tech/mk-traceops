import { StockMovementFilters } from "@/components/features/stock-movement-filters";
import {
  assemblyGroupRepository,
  locationRepository,
  materialRepository,
  stockMovementRepository,
} from "@/lib/repositories";

export default function StokHareketleriPage() {
  const movements = stockMovementRepository.getAll();
  const rows = movements.map((movement) => ({
    movement,
    material: materialRepository.getById(movement.materialId),
    location: locationRepository.getById(movement.locationId),
    assembly: movement.assemblyGroupId
      ? assemblyGroupRepository.getById(movement.assemblyGroupId)
      : undefined,
  }));

  return <StockMovementFilters rows={rows} />;
}
