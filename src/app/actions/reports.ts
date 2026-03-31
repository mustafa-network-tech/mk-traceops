"use server";

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
    getMaterialUsageReportRows(filter),
    getSupplierPriceReportRows(),
    getProductionReportRows(filter),
    getProductStockReportRows(),
    getShipmentReportRows(filter),
    getRecurringJobsReportRows(),
  ]);

  return { stock, kullanim, fiyat, uretim, mamul, sevk, tekrar };
}
