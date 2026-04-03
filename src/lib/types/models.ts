/** Tüm alan kimlikleri string; Supabase UUID ile uyumludur. */

export interface Company {
  id: string;
  name: string;
  taxNumber?: string;
  isExternalManufacturer: boolean;
  contactPhone?: string;
  city?: string;
  notes?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  notes?: string;
}

export type LocationType = "depo" | "üretim_hattı" | "sevk_bekleme";

export interface Location {
  id: string;
  name: string;
  code: string;
  type: LocationType;
}

export interface MaterialCategory {
  id: string;
  name: string;
  code: string;
}

export type MaterialType = "ham_madde" | "sarf_malzeme";

export interface Material {
  id: string;
  code: string;
  name: string;
  type: MaterialType;
  unit: string;
  minStock: number;
  currentStock: number;
  active: boolean;
  categoryId: string;
  note?: string;
  /** Yalnızca ilgili Excel aktarımında oluşturulduysa batch kimliği. */
  sourceImportBatchId?: string;
}

/** Parça başına bağlı malzeme ihtiyacı (BOM satırı). */
export interface PartMaterialRequirement {
  id: string;
  partId: string;
  materialId: string;
  quantityPerUnit: number;
  unit: string;
  note?: string;
}

/** Üst parça → alt parça (çok seviyeli BOM ağacı). */
export interface PartChildPart {
  id: string;
  parentPartId: string;
  childPartId: string;
  quantityPerParent: number;
  unit: string;
  note?: string;
}

/** Excel rota metninden türetilen işlem adımı. */
export interface PartRouteStep {
  id: string;
  partId: string;
  stepNo: number;
  operationLabel: string;
  assignedCompanyId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  notes?: string;
}

export interface MaterialSupplierRelation {
  id: string;
  materialId: string;
  supplierId: string;
  lastPurchasePrice: number;
  currency: string;
  lastPurchaseDate: string;
  isPrimary: boolean;
  priorityOrder: number;
}

export type StockMovementType =
  | "giriş"
  | "çıkış"
  | "üretimde_kullanım"
  | "iade"
  | "fire"
  | "manuel_düzeltme";

export interface StockMovement {
  id: string;
  materialId: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  occurredAt: string;
  locationId: string;
  productionOrderId?: string;
  assemblyGroupId?: string;
  projectReference?: string;
  note?: string;
  supplierId?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  active: boolean;
  note?: string;
}

export interface ProductStockItem {
  id: string;
  productId: string;
  currentStock: number;
  lastProductionDate?: string;
  locationId: string;
}

export type ShipmentStatus =
  | "taslak"
  | "hazırlanıyor"
  | "yola_çıktı"
  | "teslim_edildi"
  | "iptal";

export interface Shipment {
  id: string;
  shipmentNumber: string;
  shippedAt: string;
  recipientName: string;
  destination: string;
  contactPhone?: string;
  contactEmail?: string;
  status: ShipmentStatus;
  notes?: string;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  productId: string;
  quantity: number;
  unit: string;
  stockMovementRef?: string;
}

export type ProductionOrderStatus =
  | "taslak"
  | "planlandı"
  | "üretimde"
  | "tamamlandı"
  | "iptal";

export interface ProductionOrder {
  id: string;
  orderNo: string;
  productId: string;
  assemblyGroupId?: string;
  status: ProductionOrderStatus;
  quantityPlanned: number;
  quantityProduced: number;
  scheduledDate: string;
  departmentId: string;
  notes?: string;
  /** Planlamaya alındı / onaylandı; üretim çıkışı için zorunlu. */
  approvedAt?: string;
  approvedById?: string;
}

export interface ProductionOrderLine {
  id: string;
  productionOrderId: string;
  materialId: string;
  quantityUsed: number;
  unit: string;
  note?: string;
}

export type PartType = "ana_parça" | "alt_parça" | "montaj";

export interface Part {
  id: string;
  /** Gerçek Excel aktarımı UUID'si; mock parçalarda yok. */
  importBatchId?: string;
  partCode: string;
  description: string;
  materialId?: string;
  dimensions?: string;
  quantity: number;
  operation: string;
  assignedCompanyId?: string;
  assemblyGroupId?: string;
  type: PartType;
  importRowId?: string;
}

export interface AssemblyGroup {
  id: string;
  code: string;
  name: string;
  projectReference?: string;
  importBatchId?: string;
  notes?: string;
}

export type OperationAssignmentStatus = "beklemede" | "işlemde" | "tamamlandı";

export interface OperationAssignment {
  id: string;
  partId: string;
  operationName: string;
  assignedCompanyId: string;
  plannedDate?: string;
  status: OperationAssignmentStatus;
  notes?: string;
}

export type ImportBatchStatus = "işleniyor" | "tamamlandı" | "kısmi_hata";

export interface ImportBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedByUserId: string;
  rowCount: number;
  successCount: number;
  errorCount: number;
  status: ImportBatchStatus;
  notes?: string;
}

export type ImportRowStatus = "bekliyor" | "işlendi" | "hata" | "yok_sayıldı";

export interface ImportRow {
  id: string;
  batchId: string;
  rowIndex: number;
  rawData: Record<string, string>;
  status: ImportRowStatus;
  message?: string;
  linkedPartId?: string;
}

export interface DashboardMetrics {
  totalParts: number;
  activeAssemblyGroups: number;
  rawMaterialCount: number;
  consumableCount: number;
  criticalStockCount: number;
  pendingProductionOrders: number;
  completedProductionThisMonth: number;
  productStockSkus: number;
  openShipments: number;
  supplierCount: number;
}

export interface RecurringPartReport {
  partCode: string;
  description: string;
  occurrenceCount: number;
  assemblyGroupCodes: string[];
}

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  materialId?: string;
  supplierId?: string;
  productId?: string;
  shipmentStatus?: ShipmentStatus;
  productionStatus?: ProductionOrderStatus;
  assemblyGroupId?: string;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface ExcelImportPreviewRow {
  parcaKodu: string;
  aciklama: string;
  malzeme: string;
  olcu: string;
  adet: string;
  operasyon: string;
  montajGrubu: string;
}
