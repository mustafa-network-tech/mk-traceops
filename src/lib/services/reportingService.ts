import {
  assemblyGroupRepository,
  materialRepository,
  materialSupplierRelationRepository,
  partRepository,
  productRepository,
  productStockRepository,
  productionOrderLineRepository,
  productionOrderRepository,
  shipmentItemRepository,
  shipmentRepository,
  stockMovementRepository,
  supplierRepository,
} from "@/lib/repositories";
import type { RecurringPartReport, ReportFilter } from "@/lib/types/models";

export function getRecurringPartsReport(): RecurringPartReport[] {
  const parts = partRepository.getAll();
  const map = new Map<
    string,
    { description: string; groups: Set<string>; count: number }
  >();
  for (const p of parts) {
    const key = p.partCode;
    const g = assemblyGroupRepository.getById(p.assemblyGroupId ?? "");
    const code = g?.code ?? "—";
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        description: p.description,
        groups: new Set([code]),
        count: 1,
      });
    } else {
      cur.count += 1;
      cur.groups.add(code);
    }
  }
  return [...map.entries()]
    .filter(([, v]) => v.count > 1)
    .map(([partCode, v]) => ({
      partCode,
      description: v.description,
      occurrenceCount: v.count,
      assemblyGroupCodes: [...v.groups],
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

export function getStockMovementReportRows(f: ReportFilter) {
  const rows = stockMovementRepository.filter(f);
  return rows.map((s) => {
    const m = materialRepository.getById(s.materialId);
    return { movement: s, material: m };
  });
}

export function getMaterialUsageReportRows(f: ReportFilter) {
  const lines = productionOrderLineRepository.filterByReport(f);
  return lines.map((l) => {
    const m = materialRepository.getById(l.materialId);
    const order = productionOrderRepository.getById(l.productionOrderId);
    const product = order
      ? productRepository.getById(order.productId)
      : undefined;
    return { line: l, material: m, order, product };
  });
}

export function getSupplierPriceReportRows() {
  const rels = materialSupplierRelationRepository.getAll();
  return rels.map((r) => ({
    relation: r,
    material: materialRepository.getById(r.materialId),
    supplier: supplierRepository.getById(r.supplierId),
  }));
}

export function getProductionReportRows(f: ReportFilter) {
  return productionOrderRepository.filter(f).map((o) => ({
    order: o,
    product: productRepository.getById(o.productId),
    assembly: o.assemblyGroupId
      ? assemblyGroupRepository.getById(o.assemblyGroupId)
      : undefined,
  }));
}

export function getProductStockReportRows() {
  return productStockRepository.getAll().map((ps) => ({
    stock: ps,
    product: productRepository.getById(ps.productId),
    recentOrders: productionOrderRepository
      .getAll()
      .filter((o) => o.productId === ps.productId)
      .slice(0, 3),
  }));
}

export function getShipmentReportRows(f: ReportFilter) {
  const shipments = shipmentRepository.filter(f);
  return shipments.map((sh) => ({
    shipment: sh,
    items: shipmentItemRepository
      .getAll()
      .filter((i) => i.shipmentId === sh.id)
      .map((i) => ({
        item: i,
        product: productRepository.getById(i.productId),
      })),
  }));
}

export function getRecurringJobsReportRows() {
  return getRecurringPartsReport();
}