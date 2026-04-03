"use server";

import { requirePermission } from "@/lib/rbac/action-gate";
import { hasPermission } from "@/lib/rbac/helpers";
import type { ReportFilter } from "@/lib/types/models";
import {
  getMaterialUsageReportRows,
  getProductStockReportRows,
  getProductionReportRows,
  getRecurringJobsReportRows,
  getShipmentReportRows,
  getStockMovementReportRows,
  getSupplierPriceReportRows,
} from "@/lib/services/reportingService";

export type ReportsBundle = Awaited<ReturnType<typeof loadReportsBundle>>;

export async function loadReportsBundle(filter: ReportFilter) {
  const gate = await requirePermission("reports", "read");
  if (!gate.ok) {
    throw new Error(gate.error);
  }

  const canReadProductionOrders = hasPermission(
    gate.ctx,
    "production_orders",
    "read",
  );

  const [
    stock,
    kullanim,
    fiyat,
    uretim,
    mamul,
    sevk,
    tekrar,
  ] = await Promise.all([
    getStockMovementReportRows(filter),
    canReadProductionOrders
      ? getMaterialUsageReportRows(filter)
      : Promise.resolve([]),
    getSupplierPriceReportRows(),
    canReadProductionOrders
      ? getProductionReportRows(filter)
      : Promise.resolve([]),
    getProductStockReportRows({
      includeRecentOrders: canReadProductionOrders,
    }),
    getShipmentReportRows(filter),
    getRecurringJobsReportRows(),
  ]);

  return { stock, kullanim, fiyat, uretim, mamul, sevk, tekrar };
}
