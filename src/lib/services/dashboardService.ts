import {
  dashboardProductionTrend,
  dashboardStockMix,
} from "@/lib/data/seed";
import {
  assemblyGroupRepository,
  materialRepository,
  partRepository,
  productStockRepository,
  productionOrderRepository,
  shipmentRepository,
  stockMovementRepository,
  supplierRepository,
} from "@/lib/repositories";
import type { DashboardMetrics, StockMovement } from "@/lib/types/models";

function startOfMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getDashboardMetrics(): DashboardMetrics {
  const parts = partRepository.getAll();
  const groups = assemblyGroupRepository.getAll();
  const mats = materialRepository.getAll();
  const raw = mats.filter((m) => m.type === "ham_madde");
  const sarf = mats.filter((m) => m.type === "sarf_malzeme");
  const critical = mats.filter((m) => m.currentStock <= m.minStock);
  const orders = productionOrderRepository.getAll();
  const pending = orders.filter(
    (o) => o.status === "planlandı" || o.status === "üretimde",
  ).length;
  const monthStart = startOfMonthIso();
  const completedThisMonth = orders.filter(
    (o) => o.status === "tamamlandı" && o.scheduledDate >= monthStart,
  ).length;
  const stocks = productStockRepository.getAll();
  const openShipments = shipmentRepository
    .getAll()
    .filter((s) => s.status !== "teslim_edildi" && s.status !== "iptal").length;

  return {
    totalParts: parts.length,
    activeAssemblyGroups: groups.length,
    rawMaterialCount: raw.length,
    consumableCount: sarf.length,
    criticalStockCount: critical.length,
    pendingProductionOrders: pending,
    completedProductionThisMonth: completedThisMonth,
    productStockSkus: stocks.length,
    openShipments,
    supplierCount: supplierRepository.getAll().length,
  };
}

export function getRecentStockMovements(limit = 8): StockMovement[] {
  return [...stockMovementRepository.getAll()]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, limit);
}

export function getProductionTrend() {
  return dashboardProductionTrend;
}

export function getStockMixChart() {
  return dashboardStockMix;
}
