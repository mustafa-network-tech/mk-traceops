import { requireOperationalFactoryId } from "@/lib/data/operational-context";
import { syncPartsFromImportBatch } from "@/lib/data/import-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ImportBatchStatus } from "@/lib/types/models";
import type { PreparedImportRow } from "@/lib/services/excelParse";

const INSERT_CHUNK = 300;

export async function persistExcelImport(
  fileName: string,
  prepared: PreparedImportRow[],
): Promise<{ batchId: string }> {
  const successCount = prepared.filter((p) => p.status === "bekliyor").length;
  const errorCount = prepared.filter((p) => p.status === "hata").length;
  const status: ImportBatchStatus =
    errorCount === 0 ? "tamamlandı" : "kısmi_hata";

  const supabase = await createSupabaseServerClient();
  const factoryId = await requireOperationalFactoryId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: batch, error: batchErr } = await supabase
    .from("import_batches")
    .insert({
      file_name: fileName,
      row_count: prepared.length,
      success_count: successCount,
      error_count: errorCount,
      status,
      uploaded_by_user_id: user?.id ?? null,
      factory_id: factoryId,
    })
    .select("id")
    .single();

  if (batchErr) {
    throw new Error(batchErr.message);
  }
  if (!batch?.id) {
    throw new Error("Aktarım kaydı oluşturulamadı.");
  }

  const batchId = batch.id as string;

  for (let i = 0; i < prepared.length; i += INSERT_CHUNK) {
    const slice = prepared.slice(i, i + INSERT_CHUNK);
    const rows = slice.map((p) => ({
      batch_id: batchId,
      row_index: p.rowIndex,
      raw_data: p.rawData,
      status: p.status,
      message: p.message ?? null,
    }));
    const { error: rowErr } = await supabase.from("import_rows").insert(rows);
    if (rowErr) {
      throw new Error(rowErr.message);
    }
  }

  await syncPartsFromImportBatch(supabase, batchId);

  return { batchId };
}
