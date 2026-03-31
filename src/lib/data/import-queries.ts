import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ImportBatch,
  ImportBatchStatus,
  ImportRow,
  ImportRowStatus,
} from "@/lib/types/models";

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

export async function listImportBatches(): Promise<ImportBatch[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select(
      "id, file_name, uploaded_by_user_id, row_count, success_count, error_count, status, notes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as BatchRow[] | null)?.map(mapBatchRow) ?? [];
}

export async function getImportBatchById(
  id: string,
): Promise<ImportBatch | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select(
      "id, file_name, uploaded_by_user_id, row_count, success_count, error_count, status, notes, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapBatchRow(data as BatchRow);
}

export async function listImportRowsForBatch(
  batchId: string,
): Promise<ImportRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

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
