import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProductionOrder } from "@/lib/data/supabase-data";
import type {
  ImportBatch,
  ImportBatchStatus,
  ImportRow,
  ImportRowStatus,
  ProductionOrder,
} from "@/lib/types/models";

function normalizeOne<T extends Record<string, unknown>>(v: unknown): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) {
    const x = v[0];
    return x && typeof x === "object" ? (x as T) : null;
  }
  if (typeof v === "object") return v as T;
  return null;
}

type BatchRow = {
  id: string;
  file_name: string;
  uploaded_by_user_id: string | null;
  row_count: number;
  success_count: number;
  error_count: number;
  status: string;
  notes: string | null;
  created_at: string;
  factory_id: string;
  factories: unknown;
};

type RowDb = {
  id: string;
  batch_id: string;
  row_index: number;
  raw_data: Record<string, unknown>;
  status: string;
  message: string | null;
  linked_part_id: string | null;
};

function mapBatchRow(row: BatchRow): ImportBatch {
  return {
    id: row.id,
    fileName: row.file_name,
    uploadedAt: row.created_at,
    uploadedByUserId: row.uploaded_by_user_id ?? "",
    rowCount: row.row_count,
    successCount: row.success_count,
    errorCount: row.error_count,
    status: row.status as ImportBatchStatus,
    notes: row.notes ?? undefined,
  };
}

function rawDataToRecord(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) out[k] = "";
    else if (typeof v === "object") out[k] = JSON.stringify(v);
    else out[k] = String(v);
  }
  return out;
}

function mapImportRow(row: RowDb): ImportRow {
  return {
    id: row.id,
    batchId: row.batch_id,
    rowIndex: row.row_index,
    rawData: rawDataToRecord(
      row.raw_data && typeof row.raw_data === "object"
        ? (row.raw_data as Record<string, unknown>)
        : {},
    ),
    status: row.status as ImportRowStatus,
    message: row.message ?? undefined,
    linkedPartId: row.linked_part_id ?? undefined,
  };
}

async function assertPlatformAdmin(): Promise<boolean> {
  const ctx = await getRbacSession();
  return Boolean(ctx?.user && isPlatformAdmin(ctx.user));
}

export type PlatformImportBatchRow = ImportBatch & {
  factoryId: string;
  factoryName: string;
  factorySlug: string;
};

export async function listPlatformImportBatches(): Promise<PlatformImportBatchRow[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await assertPlatformAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select(
      "id, file_name, uploaded_by_user_id, row_count, success_count, error_count, status, notes, created_at, factory_id, factories ( name, slug )",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  return ((data as unknown as BatchRow[]) ?? []).map((row) => {
    const b = mapBatchRow(row);
    const f = normalizeOne<{ name: string; slug: string }>(row.factories);
    return {
      ...b,
      factoryId: row.factory_id,
      factoryName: f?.name ?? "—",
      factorySlug: f?.slug ?? "",
    };
  });
}

export async function getPlatformImportBatch(
  id: string,
): Promise<PlatformImportBatchRow | null> {
  if (!isSupabaseConfigured()) return null;
  if (!(await assertPlatformAdmin())) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select(
      "id, file_name, uploaded_by_user_id, row_count, success_count, error_count, status, notes, created_at, factory_id, factories ( name, slug )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as BatchRow;
  const b = mapBatchRow(row);
  const f = normalizeOne<{ name: string; slug: string }>(row.factories);
  return {
    ...b,
    factoryId: row.factory_id,
    factoryName: f?.name ?? "—",
    factorySlug: f?.slug ?? "",
  };
}

export async function listPlatformImportRows(batchId: string): Promise<ImportRow[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await assertPlatformAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_rows")
    .select(
      "id, batch_id, row_index, raw_data, status, message, linked_part_id",
    )
    .eq("batch_id", batchId)
    .order("row_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as RowDb[] | null)?.map(mapImportRow) ?? [];
}

type StockRow = {
  id: string;
  material_id: string;
  type: string;
  quantity: number | string;
  unit: string;
  occurred_at: string;
  location_id: string;
  production_order_id: string | null;
  note: string | null;
  factory_id: string;
  factories: unknown;
  materials: unknown;
  locations: unknown;
};

export type PlatformStockMovementRow = {
  id: string;
  factoryId: string;
  factoryName: string;
  factorySlug: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  type: string;
  quantity: number;
  unit: string;
  occurredAt: string;
  locationCode: string;
  locationName: string;
  productionOrderId: string | null;
  note: string | null;
};

export async function listPlatformStockMovements(
  limit = 400,
): Promise<PlatformStockMovementRow[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await assertPlatformAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id, material_id, type, quantity, unit, occurred_at, location_id, production_order_id, note, factory_id, factories ( name, slug ), materials ( code, name ), locations ( code, name )",
    )
    .order("occurred_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 1000));

  if (error) throw new Error(error.message);

  return ((data as unknown as StockRow[]) ?? []).map((r) => {
    const f = normalizeOne<{ name: string; slug: string }>(r.factories);
    const m = normalizeOne<{ code: string; name: string }>(r.materials);
    const l = normalizeOne<{ code: string; name: string }>(r.locations);
    return {
      id: r.id,
      factoryId: r.factory_id,
      factoryName: f?.name ?? "—",
      factorySlug: f?.slug ?? "",
      materialId: r.material_id,
      materialCode: m?.code ?? "—",
      materialName: m?.name ?? "—",
      type: r.type,
      quantity: Number(r.quantity),
      unit: r.unit ?? "adet",
      occurredAt: r.occurred_at,
      locationCode: l?.code ?? "—",
      locationName: l?.name ?? "—",
      productionOrderId: r.production_order_id,
      note: r.note,
    };
  });
}

type PoRow = Record<string, unknown> & {
  factory_id: string;
  factories: unknown;
  products: unknown;
};

export type PlatformProductionOrderRow = ProductionOrder & {
  factoryId: string;
  factoryName: string;
  factorySlug: string;
  productCode: string;
  productName: string;
};

export type PlatformPartSummary = { id: string; partCode: string; description: string };

/** Aktarım partisine bağlı parça özetleri (platform yöneticisi; tüm kiracılar). */
export async function listPlatformPartsByImportBatch(
  batchId: string,
): Promise<PlatformPartSummary[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await assertPlatformAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("parts")
    .select("id, part_code, description")
    .eq("import_batch_id", batchId)
    .order("part_code");

  if (error) throw new Error(error.message);
  return (
    (data as { id: string; part_code: string; description: string }[] | null)?.map(
      (r) => ({
        id: r.id,
        partCode: r.part_code,
        description: r.description ?? "",
      }),
    ) ?? []
  );
}

export async function listPlatformProductionOrders(
  limit = 150,
): Promise<PlatformProductionOrderRow[]> {
  if (!isSupabaseConfigured()) return [];
  if (!(await assertPlatformAdmin())) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("production_orders")
    .select(
      "*, factories ( name, slug ), products ( code, name )",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) throw new Error(error.message);

  return ((data as unknown as PoRow[]) ?? []).map((r) => {
    const o = mapProductionOrder(r as Record<string, unknown>);
    const f = normalizeOne<{ name: string; slug: string }>(r.factories);
    const p = normalizeOne<{ code: string; name: string }>(r.products);
    return {
      ...o,
      factoryId: r.factory_id as string,
      factoryName: f?.name ?? "—",
      factorySlug: f?.slug ?? "",
      productCode: p?.code ?? "—",
      productName: p?.name ?? "—",
    };
  });
}
