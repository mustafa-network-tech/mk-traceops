import { getOperationalFactoryId } from "@/lib/data/operational-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssemblyGroup,
  Company,
  Department,
  Location,
  Material,
  MaterialCategory,
  MaterialSupplierRelation,
  OperationAssignment,
  Part,
  PartMaterialRequirement,
  PartRouteStep,
  Product,
  ProductStockItem,
  ProductionOrder,
  ProductionOrderLine,
  ReportFilter,
  Shipment,
  ShipmentItem,
  StockMovement,
  Supplier,
  User,
} from "@/lib/types/models";

async function client() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseServerClient();
}

async function factoryScope(): Promise<{
  c: SupabaseClient;
  factoryId: string;
} | null> {
  const c = await client();
  if (!c) return null;
  const factoryId = await getOperationalFactoryId();
  if (!factoryId) return null;
  return { c, factoryId };
}

type Row = Record<string, unknown>;

export function mapCompany(r: Row): Company {
  return {
    id: r.id as string,
    name: r.name as string,
    taxNumber: (r.tax_number as string) ?? undefined,
    isExternalManufacturer: Boolean(r.is_external_manufacturer),
    contactPhone: (r.contact_phone as string) ?? undefined,
    city: (r.city as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
  };
}

export function mapUser(r: Row): User {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    email: r.email as string,
    role: r.role as string,
    departmentId: (r.department_id as string) ?? undefined,
  };
}

export function mapDepartment(r: Row): Department {
  return {
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    notes: (r.notes as string) ?? undefined,
  };
}

export function mapLocation(r: Row): Location {
  return {
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    type: r.type as Location["type"],
  };
}

export function mapMaterialCategory(r: Row): MaterialCategory {
  return {
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
  };
}

export function mapSupplier(r: Row): Supplier {
  return {
    id: r.id as string,
    name: r.name as string,
    contactPerson: (r.contact_person as string) ?? undefined,
    phone: (r.phone as string) ?? undefined,
    whatsapp: (r.whatsapp as string) ?? undefined,
    email: (r.email as string) ?? undefined,
    city: (r.city as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
  };
}

function numOrZero(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function mapMaterial(r: Row): Material {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    type: r.type as Material["type"],
    unit: r.unit as string,
    minStock: numOrZero(r.min_stock),
    currentStock: numOrZero(r.current_stock),
    active: Boolean(r.active),
    categoryId: r.category_id as string,
    note: (r.note as string) ?? undefined,
    sourceImportBatchId: (r.source_import_batch_id as string) ?? undefined,
  };
}

export function mapPartMaterialRequirement(r: Row): PartMaterialRequirement {
  return {
    id: r.id as string,
    partId: r.part_id as string,
    materialId: r.material_id as string,
    quantityPerUnit: numOrZero(r.quantity_per_unit),
    unit: (r.unit as string) ?? "adet",
    note: (r.note as string) ?? undefined,
  };
}

export function mapPartRouteStep(r: Row): PartRouteStep {
  return {
    id: r.id as string,
    partId: r.part_id as string,
    stepNo: Number(r.step_no),
    operationLabel: r.operation_label as string,
    assignedCompanyId: (r.assigned_company_id as string) ?? undefined,
  };
}

export function mapMaterialSupplierRelation(r: Row): MaterialSupplierRelation {
  return {
    id: r.id as string,
    materialId: r.material_id as string,
    supplierId: r.supplier_id as string,
    lastPurchasePrice: Number(r.last_purchase_price),
    currency: r.currency as string,
    lastPurchaseDate: r.last_purchase_date as string,
    isPrimary: Boolean(r.is_primary),
    priorityOrder: Number(r.priority_order),
  };
}

export function mapStockMovement(r: Row): StockMovement {
  return {
    id: r.id as string,
    materialId: r.material_id as string,
    type: r.type as StockMovement["type"],
    quantity: Number(r.quantity),
    unit: r.unit as string,
    occurredAt: r.occurred_at as string,
    locationId: r.location_id as string,
    productionOrderId: (r.production_order_id as string) ?? undefined,
    assemblyGroupId: (r.assembly_group_id as string) ?? undefined,
    projectReference: (r.project_reference as string) ?? undefined,
    note: (r.note as string) ?? undefined,
    supplierId: (r.supplier_id as string) ?? undefined,
  };
}

export function mapProduct(r: Row): Product {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    category: r.category as string,
    unit: r.unit as string,
    active: Boolean(r.active),
    note: (r.note as string) ?? undefined,
  };
}

export function mapProductStockItem(r: Row): ProductStockItem {
  return {
    id: r.id as string,
    productId: r.product_id as string,
    currentStock: Number(r.current_stock),
    lastProductionDate: (r.last_production_date as string) ?? undefined,
    locationId: r.location_id as string,
  };
}

export function mapShipment(r: Row): Shipment {
  return {
    id: r.id as string,
    shipmentNumber: r.shipment_number as string,
    shippedAt: r.shipped_at as string,
    recipientName: r.recipient_name as string,
    destination: r.destination as string,
    contactPhone: (r.contact_phone as string) ?? undefined,
    contactEmail: (r.contact_email as string) ?? undefined,
    status: r.status as Shipment["status"],
    notes: (r.notes as string) ?? undefined,
  };
}

export function mapShipmentItem(r: Row): ShipmentItem {
  return {
    id: r.id as string,
    shipmentId: r.shipment_id as string,
    productId: r.product_id as string,
    quantity: Number(r.quantity),
    unit: r.unit as string,
    stockMovementRef: (r.stock_movement_ref as string) ?? undefined,
  };
}

export function mapProductionOrder(r: Row): ProductionOrder {
  return {
    id: r.id as string,
    orderNo: r.order_no as string,
    productId: r.product_id as string,
    assemblyGroupId: (r.assembly_group_id as string) ?? undefined,
    status: r.status as ProductionOrder["status"],
    quantityPlanned: Number(r.quantity_planned),
    quantityProduced: Number(r.quantity_produced),
    scheduledDate: r.scheduled_date as string,
    departmentId: r.department_id as string,
    notes: (r.notes as string) ?? undefined,
  };
}

export function mapProductionOrderLine(r: Row): ProductionOrderLine {
  return {
    id: r.id as string,
    productionOrderId: r.production_order_id as string,
    materialId: r.material_id as string,
    quantityUsed: Number(r.quantity_used),
    unit: r.unit as string,
    note: (r.note as string) ?? undefined,
  };
}

export function mapAssemblyGroup(r: Row): AssemblyGroup {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    projectReference: (r.project_reference as string) ?? undefined,
    importBatchId: (r.import_batch_id as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
  };
}

export function mapPart(r: Row): Part {
  return {
    id: r.id as string,
    importBatchId: (r.import_batch_id as string) ?? undefined,
    partCode: r.part_code as string,
    description: r.description as string,
    materialId: (r.material_id as string) ?? undefined,
    dimensions: (r.dimensions as string) ?? undefined,
    quantity: Number(r.quantity),
    operation: r.operation as string,
    assignedCompanyId: (r.assigned_company_id as string) ?? undefined,
    assemblyGroupId: (r.assembly_group_id as string) ?? undefined,
    type: r.type as Part["type"],
    importRowId: (r.import_row_id as string) ?? undefined,
  };
}

export function mapOperationAssignment(r: Row): OperationAssignment {
  return {
    id: r.id as string,
    partId: r.part_id as string,
    operationName: r.operation_name as string,
    assignedCompanyId: r.assigned_company_id as string,
    plannedDate: (r.planned_date as string) ?? undefined,
    status: r.status as OperationAssignment["status"],
    notes: (r.notes as string) ?? undefined,
  };
}

export async function listCompanies(): Promise<Company[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("companies")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapCompany) ?? [];
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCompany(data as Row) : undefined;
}

export async function listUsers(): Promise<User[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("users")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapUser) ?? [];
}

export async function getUser(id: string): Promise<User | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapUser(data as Row) : undefined;
}

export async function listDepartments(): Promise<Department[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("departments")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapDepartment) ?? [];
}

export async function getDepartment(id: string): Promise<Department | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("departments")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDepartment(data as Row) : undefined;
}

export async function listLocations(): Promise<Location[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("locations")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapLocation) ?? [];
}

export async function getLocation(id: string): Promise<Location | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("locations")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapLocation(data as Row) : undefined;
}

export async function listMaterialCategories(): Promise<MaterialCategory[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("material_categories")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapMaterialCategory) ?? [];
}

export async function getMaterialCategory(
  id: string,
): Promise<MaterialCategory | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("material_categories")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMaterialCategory(data as Row) : undefined;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("suppliers")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapSupplier) ?? [];
}

export async function getSupplier(id: string): Promise<Supplier | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSupplier(data as Row) : undefined;
}

export async function listMaterials(): Promise<Material[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("materials")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapMaterial) ?? [];
}

export async function getMaterial(id: string): Promise<Material | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("materials")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMaterial(data as Row) : undefined;
}

export async function listMaterialsByType(
  type: "ham_madde" | "sarf_malzeme",
): Promise<Material[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("materials")
    .select("*")
    .eq("factory_id", s.factoryId)
    .eq("type", type)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapMaterial) ?? [];
}

export async function listMaterialSupplierRelations(): Promise<
  MaterialSupplierRelation[]
> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c.from("material_supplier_relations").select("*");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapMaterialSupplierRelation) ?? [];
}

export async function relationsByMaterialId(
  materialId: string,
): Promise<MaterialSupplierRelation[]> {
  const all = await listMaterialSupplierRelations();
  return all.filter((r) => r.materialId === materialId);
}

export async function relationsBySupplierId(
  supplierId: string,
): Promise<MaterialSupplierRelation[]> {
  const all = await listMaterialSupplierRelations();
  return all.filter((r) => r.supplierId === supplierId);
}

export async function listStockMovements(): Promise<StockMovement[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("stock_movements")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapStockMovement) ?? [];
}

export async function getStockMovement(
  id: string,
): Promise<StockMovement | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("stock_movements")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapStockMovement(data as Row) : undefined;
}

export async function filterStockMovements(
  f: ReportFilter,
): Promise<StockMovement[]> {
  let rows = await listStockMovements();
  if (f.materialId) rows = rows.filter((s) => s.materialId === f.materialId);
  if (f.supplierId) rows = rows.filter((s) => s.supplierId === f.supplierId);
  if (f.dateFrom)
    rows = rows.filter((s) => s.occurredAt >= `${f.dateFrom}T00:00:00.000Z`);
  if (f.dateTo)
    rows = rows.filter((s) => s.occurredAt <= `${f.dateTo}T23:59:59.999Z`);
  if (f.assemblyGroupId)
    rows = rows.filter((s) => s.assemblyGroupId === f.assemblyGroupId);
  return rows;
}

export async function listProducts(): Promise<Product[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("products")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapProduct) ?? [];
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as Row) : undefined;
}

export async function listProductStockItems(): Promise<ProductStockItem[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c.from("product_stock_items").select("*");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapProductStockItem) ?? [];
}

export async function getProductStockByProductId(
  productId: string,
): Promise<ProductStockItem | undefined> {
  const all = await listProductStockItems();
  return all.find((p) => p.productId === productId);
}

export async function listShipments(): Promise<Shipment[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("shipments")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("shipped_at", {
      ascending: false,
    });
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapShipment) ?? [];
}

export async function getShipment(id: string): Promise<Shipment | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("shipments")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapShipment(data as Row) : undefined;
}

export async function getShipmentItems(shipmentId: string): Promise<ShipmentItem[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("shipment_items")
    .select("*")
    .eq("shipment_id", shipmentId);
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapShipmentItem) ?? [];
}

export async function filterShipments(f: ReportFilter): Promise<Shipment[]> {
  let rows = await listShipments();
  if (f.shipmentStatus) rows = rows.filter((s) => s.status === f.shipmentStatus);
  if (f.dateFrom) rows = rows.filter((s) => s.shippedAt >= `${f.dateFrom}T00:00:00.000Z`);
  if (f.dateTo) rows = rows.filter((s) => s.shippedAt <= `${f.dateTo}T23:59:59.999Z`);
  return rows;
}

export async function listProductionOrders(): Promise<ProductionOrder[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("production_orders")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("scheduled_date", {
      ascending: false,
    });
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapProductionOrder) ?? [];
}

export async function getProductionOrder(
  id: string,
): Promise<ProductionOrder | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("production_orders")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProductionOrder(data as Row) : undefined;
}

export async function getProductionOrderLines(
  orderId: string,
): Promise<ProductionOrderLine[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("production_order_lines")
    .select("*")
    .eq("production_order_id", orderId);
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapProductionOrderLine) ?? [];
}

export async function filterProductionOrders(
  f: ReportFilter,
): Promise<ProductionOrder[]> {
  let rows = await listProductionOrders();
  if (f.productionStatus) rows = rows.filter((p) => p.status === f.productionStatus);
  if (f.productId) rows = rows.filter((p) => p.productId === f.productId);
  if (f.assemblyGroupId)
    rows = rows.filter((p) => p.assemblyGroupId === f.assemblyGroupId);
  if (f.dateFrom) rows = rows.filter((p) => p.scheduledDate >= f.dateFrom!);
  if (f.dateTo) rows = rows.filter((p) => p.scheduledDate <= f.dateTo!);
  return rows;
}

export async function listProductionOrderLines(): Promise<ProductionOrderLine[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c.from("production_order_lines").select("*");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapProductionOrderLine) ?? [];
}

export async function filterProductionOrderLines(
  f: ReportFilter,
): Promise<ProductionOrderLine[]> {
  let lines = await listProductionOrderLines();
  if (f.materialId) lines = lines.filter((l) => l.materialId === f.materialId);
  if (f.dateFrom || f.dateTo || f.productId || f.assemblyGroupId) {
    const orders = await filterProductionOrders(f);
    const ids = new Set(orders.map((o) => o.id));
    lines = lines.filter((l) => ids.has(l.productionOrderId));
  }
  return lines;
}

export async function listParts(): Promise<Part[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("parts")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("part_code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapPart) ?? [];
}

/** Parçalardaki quantity toplamı (malzeme başına). Depo stoğu değil; Excel Adet satırlarının özeti. */
export async function sumPartQuantitiesByMaterialId(): Promise<Map<string, number>> {
  const parts = await listParts();
  const m = new Map<string, number>();
  for (const p of parts) {
    if (!p.materialId) continue;
    const q = Number(p.quantity);
    if (!Number.isFinite(q)) continue;
    m.set(p.materialId, (m.get(p.materialId) ?? 0) + q);
  }
  return m;
}

export async function getPart(id: string): Promise<Part | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("parts")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPart(data as Row) : undefined;
}

export async function listPartsByBatchId(batchId: string): Promise<Part[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("parts")
    .select("*")
    .eq("import_batch_id", batchId)
    .eq("factory_id", s.factoryId);
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapPart) ?? [];
}

export async function listPartsByAssemblyGroupId(
  assemblyGroupId: string,
): Promise<Part[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("parts")
    .select("*")
    .eq("assembly_group_id", assemblyGroupId)
    .eq("factory_id", s.factoryId);
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapPart) ?? [];
}

export async function listPartRouteStepsForPartIds(
  partIds: string[],
): Promise<PartRouteStep[]> {
  const s = await factoryScope();
  if (!s || partIds.length === 0) return [];
  const { data, error } = await s.c
    .from("part_route_steps")
    .select("*")
    .in("part_id", partIds)
    .order("part_id", { ascending: true })
    .order("step_no", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapPartRouteStep) ?? [];
}

export async function listAssemblyGroups(): Promise<AssemblyGroup[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("assembly_groups")
    .select("*")
    .eq("factory_id", s.factoryId)
    .order("code");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapAssemblyGroup) ?? [];
}

export async function getAssemblyGroup(
  id: string,
): Promise<AssemblyGroup | undefined> {
  const s = await factoryScope();
  if (!s) return undefined;
  const { data, error } = await s.c
    .from("assembly_groups")
    .select("*")
    .eq("id", id)
    .eq("factory_id", s.factoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAssemblyGroup(data as Row) : undefined;
}

export async function listAssemblyGroupsByBatchId(
  batchId: string,
): Promise<AssemblyGroup[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c
    .from("assembly_groups")
    .select("*")
    .eq("import_batch_id", batchId)
    .eq("factory_id", s.factoryId);
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapAssemblyGroup) ?? [];
}

export async function listOperationAssignments(): Promise<OperationAssignment[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c.from("operation_assignments").select("*");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapOperationAssignment) ?? [];
}

export async function listOperationAssignmentsByPartId(
  partId: string,
): Promise<OperationAssignment[]> {
  const all = await listOperationAssignments();
  return all.filter((o) => o.partId === partId);
}

export async function listShipmentItems(): Promise<ShipmentItem[]> {
  const s = await factoryScope();
  if (!s) return [];
  const { data, error } = await s.c.from("shipment_items").select("*");
  if (error) throw new Error(error.message);
  return (data as Row[] | null)?.map(mapShipmentItem) ?? [];
}

export async function filterShipmentItems(f: ReportFilter): Promise<ShipmentItem[]> {
  const shipmentsFiltered = await filterShipments(f);
  const ids = new Set(shipmentsFiltered.map((s) => s.id));
  let items = (await listShipmentItems()).filter((i) => ids.has(i.shipmentId));
  if (f.productId) items = items.filter((i) => i.productId === f.productId);
  return items;
}
