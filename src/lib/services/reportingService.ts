import {
  filterProductionOrderLines,
  filterProductionOrders,
  filterShipments,
  filterStockMovements,
  getAssemblyGroup,
  getMaterial,
  getProduct,
  getProductionOrder,
  getSupplier,
  listAssemblyGroups,
  listMaterialSupplierRelations,
  listParts,
  listProductStockItems,
  listProductionOrders,
  listShipmentItems,
  listSuppliers,
} from "@/lib/data/d1-data";
import type { RecurringPartReport, ReportFilter } from "@/lib/types/models";

export async function getRecurringPartsReport(): Promise<RecurringPartReport[]> {
  const parts = await listParts();
  const groups = await listAssemblyGroups();
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const map = new Map<
    string,
    { description: string; groups: Set<string>; count: number }
  >();
  for (const p of parts) {
    const key = p.partCode;
    const g = p.assemblyGroupId ? groupById.get(p.assemblyGroupId) : undefined;
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

export async function getStockMovementReportRows(f: ReportFilter) {
  const rows = await filterStockMovements(f);
  const out: { movement: (typeof rows)[0]; material: Awaited<ReturnType<typeof getMaterial>> }[] = [];
  for (const s of rows) {
    out.push({ movement: s, material: await getMaterial(s.materialId) });
  }
  return out;
}

export async function getMaterialUsageReportRows(f: ReportFilter) {
  const lines = await filterProductionOrderLines(f);
  const out: {
    line: (typeof lines)[0];
    material: Awaited<ReturnType<typeof getMaterial>>;
    order: Awaited<ReturnType<typeof getProductionOrder>>;
    product: Awaited<ReturnType<typeof getProduct>>;
  }[] = [];

  for (const l of lines) {
    const order = await getProductionOrder(l.productionOrderId);
    const product = order ? await getProduct(order.productId) : undefined;
    out.push({
      line: l,
      material: await getMaterial(l.materialId),
      order,
      product,
    });
  }
  return out;
}

export async function getSupplierPriceReportRows() {
  const rels = await listMaterialSupplierRelations();
  const out = [];
  for (const r of rels) {
    out.push({
      relation: r,
      material: await getMaterial(r.materialId),
      supplier: await getSupplier(r.supplierId),
    });
  }
  return out;
}

export async function getProductionReportRows(f: ReportFilter) {
  const filtered = await filterProductionOrders(f);
  const out = [];
  for (const o of filtered) {
    out.push({
      order: o,
      product: await getProduct(o.productId),
      assembly: o.assemblyGroupId
        ? await getAssemblyGroup(o.assemblyGroupId)
        : undefined,
    });
  }
  return out;
}

export async function getProductStockReportRows(options?: {
  /** false: üretim emri listesi çekilmez; yakın UE sütunu boş kalır (RBAC). */
  includeRecentOrders?: boolean;
}) {
  const includeRecent = options?.includeRecentOrders !== false;
  const stocks = await listProductStockItems();
  const orders = includeRecent ? await listProductionOrders() : [];
  const out = [];
  for (const ps of stocks) {
    out.push({
      stock: ps,
      product: await getProduct(ps.productId),
      recentOrders: orders.filter((o) => o.productId === ps.productId).slice(0, 3),
    });
  }
  return out;
}

export async function getShipmentReportRows(f: ReportFilter) {
  const shipments = await filterShipments(f);
  const allItems = await listShipmentItems();
  const out = [];
  for (const sh of shipments) {
    const shItems = allItems.filter((i) => i.shipmentId === sh.id);
    const mapped = [];
    for (const i of shItems) {
      mapped.push({ item: i, product: await getProduct(i.productId) });
    }
    out.push({ shipment: sh, items: mapped });
  }
  return out;
}

export async function getRecurringJobsReportRows() {
  return getRecurringPartsReport();
}
