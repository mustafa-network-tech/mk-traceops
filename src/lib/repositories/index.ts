import {
  assemblyGroups,
  companies,
  departments,
  locations,
  materialCategories,
  materialSupplierRelations,
  materials,
  operationAssignments,
  parts,
  productStockItems,
  productionOrderLines,
  productionOrders,
  products,
  shipmentItems,
  shipments,
  stockMovements,
  suppliers,
  users,
} from "@/lib/data/seed";
import type { ReportFilter } from "@/lib/types/models";

export const companyRepository = {
  getAll: () => companies,
  getById: (id: string) => companies.find((c) => c.id === id),
};

export const userRepository = {
  getAll: () => users,
  getById: (id: string) => users.find((u) => u.id === id),
};

export const departmentRepository = {
  getAll: () => departments,
  getById: (id: string) => departments.find((d) => d.id === id),
};

export const locationRepository = {
  getAll: () => locations,
  getById: (id: string) => locations.find((l) => l.id === id),
};

export const materialCategoryRepository = {
  getAll: () => materialCategories,
  getById: (id: string) => materialCategories.find((c) => c.id === id),
};

export const supplierRepository = {
  getAll: () => suppliers,
  getById: (id: string) => suppliers.find((s) => s.id === id),
};

export const materialRepository = {
  getAll: () => materials,
  getById: (id: string) => materials.find((m) => m.id === id),
  getByType: (type: "ham_madde" | "sarf_malzeme") =>
    materials.filter((m) => m.type === type),
};

export const materialSupplierRelationRepository = {
  getAll: () => materialSupplierRelations,
  getByMaterialId: (materialId: string) =>
    materialSupplierRelations.filter((r) => r.materialId === materialId),
  getBySupplierId: (supplierId: string) =>
    materialSupplierRelations.filter((r) => r.supplierId === supplierId),
};

export const stockMovementRepository = {
  getAll: () => stockMovements,
  getById: (id: string) => stockMovements.find((s) => s.id === id),
  filter: (f: ReportFilter) =>
    stockMovements.filter((s) => {
      if (f.materialId && s.materialId !== f.materialId) return false;
      if (f.supplierId && s.supplierId !== f.supplierId) return false;
      if (f.dateFrom && s.occurredAt < `${f.dateFrom}T00:00:00.000Z`)
        return false;
      if (f.dateTo && s.occurredAt > `${f.dateTo}T23:59:59.999Z`) return false;
      if (f.assemblyGroupId && s.assemblyGroupId !== f.assemblyGroupId)
        return false;
      return true;
    }),
};

export const productRepository = {
  getAll: () => products,
  getById: (id: string) => products.find((p) => p.id === id),
};

export const productStockRepository = {
  getAll: () => productStockItems,
  getByProductId: (productId: string) =>
    productStockItems.find((p) => p.productId === productId),
};

export const shipmentRepository = {
  getAll: () => shipments,
  getById: (id: string) => shipments.find((s) => s.id === id),
  getItems: (shipmentId: string) =>
    shipmentItems.filter((i) => i.shipmentId === shipmentId),
  filter: (f: ReportFilter) =>
    shipments.filter((sh) => {
      if (f.shipmentStatus && sh.status !== f.shipmentStatus) return false;
      if (f.dateFrom && sh.shippedAt < `${f.dateFrom}T00:00:00.000Z`)
        return false;
      if (f.dateTo && sh.shippedAt > `${f.dateTo}T23:59:59.999Z`) return false;
      return true;
    }),
};

export const productionOrderRepository = {
  getAll: () => productionOrders,
  getById: (id: string) => productionOrders.find((p) => p.id === id),
  getLines: (orderId: string) =>
    productionOrderLines.filter((l) => l.productionOrderId === orderId),
  filter: (f: ReportFilter) =>
    productionOrders.filter((p) => {
      if (f.productionStatus && p.status !== f.productionStatus) return false;
      if (f.productId && p.productId !== f.productId) return false;
      if (f.assemblyGroupId && p.assemblyGroupId !== f.assemblyGroupId)
        return false;
      if (f.dateFrom && p.scheduledDate < f.dateFrom) return false;
      if (f.dateTo && p.scheduledDate > f.dateTo) return false;
      return true;
    }),
};

export const partRepository = {
  getAll: () => parts,
  getById: (id: string) => parts.find((p) => p.id === id),
  getByBatchId: (batchId: string) =>
    parts.filter((p) => p.importBatchId === batchId),
  getByAssemblyGroupId: (assemblyGroupId: string) =>
    parts.filter((p) => p.assemblyGroupId === assemblyGroupId),
};

export const assemblyGroupRepository = {
  getAll: () => assemblyGroups,
  getById: (id: string) => assemblyGroups.find((a) => a.id === id),
  getByImportBatchId: (batchId: string) =>
    assemblyGroups.filter((a) => a.importBatchId === batchId),
};

export const operationAssignmentRepository = {
  getAll: () => operationAssignments,
  getByPartId: (partId: string) =>
    operationAssignments.filter((o) => o.partId === partId),
};

export const productionOrderLineRepository = {
  getAll: () => productionOrderLines,
  getByProductionOrderId: (id: string) =>
    productionOrderLines.filter((l) => l.productionOrderId === id),
  filterByReport: (f: ReportFilter) => {
    let lines = productionOrderLines;
    if (f.materialId) {
      lines = lines.filter((l) => l.materialId === f.materialId);
    }
    if (f.dateFrom || f.dateTo || f.productId || f.assemblyGroupId) {
      const orders = productionOrderRepository.filter(f);
      const ids = new Set(orders.map((o) => o.id));
      lines = lines.filter((l) => ids.has(l.productionOrderId));
    }
    return lines;
  },
};

export const shipmentItemRepository = {
  getAll: () => shipmentItems,
  filterByReport: (f: ReportFilter) => {
    const shipmentsFiltered = shipmentRepository.filter(f);
    const ids = new Set(shipmentsFiltered.map((s) => s.id));
    let items = shipmentItems.filter((i) => ids.has(i.shipmentId));
    if (f.productId) {
      items = items.filter((i) => i.productId === f.productId);
    }
    return items;
  },
};
