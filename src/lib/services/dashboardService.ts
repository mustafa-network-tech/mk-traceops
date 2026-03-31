import {
  dashboardProductionTrend,
  dashboardStockMix,
} from "@/lib/data/seed";
import {
  listAssemblyGroups,
  listMaterials,
  listParts,
  listProductStockItems,
  listProductionOrders,
  listShipments,
  listStockMovements,
  listSuppliers,
} from "@/lib/data/supabase-data";
import type { DashboardMetrics, StockMovement } from "@/lib/types/models";

function startOfMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const parts = await listParts();
  const groups = await listAssemblyGroups();
  const mats = await listMaterials();
  const raw = mats.filter((m) => m.type === "ham_madde");
  const sarf = mats.filter((m) => m.type === "sarf_malzeme");
  const critical = mats.filter((m) => m.currentStock <= m.minStock);
  const orders = await listProductionOrders();
  const pending = orders.filter(
    (o) => o.status === "planlandı" || o.status === "üretimde",
  ).length;
  const monthStart = startOfMonthIso();
  const completedThisMonth = orders.filter(
    (o) => o.status === "tamamlandı" && o.scheduledDate >= monthStart,
  ).length;
  const stocks = await listProductStockItems();
  const openShipments = (await listShipments()).filter(
    (s) => s.status !== "teslim_edildi" && s.status !== "iptal",
  ).length;

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
    supplierCount: (await listSuppliers()).length,
  };
}

export async function getRecentStockMovements(
  limit = 8,
): Promise<StockMovement[]> {
  return (await listStockMovements()).slice(0, limit);
}

export function getProductionTrend() {
  return dashboardProductionTrend;
}

export function getStockMixChart() {
  return dashboardStockMix;
}
