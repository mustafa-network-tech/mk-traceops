"use server";

import { persistExcelImport } from "@/lib/data/import-persist";
import { EXCEL_MAX_BYTES, parseProductionExcelBuffer } from "@/lib/services/excelParse";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ExcelImportActionResult =
  | { ok: true; batchId: string }
  | { ok: false; error: string };

export async function uploadExcelImportAction(
  formData: FormData,
): Promise<ExcelImportActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase yapılandırılmamış. .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY tanımlayın.",
    };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Dosya seçilmedi." };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return { ok: false, error: "Yalnızca .xlsx dosyaları kabul edilir." };
  }

  if (file.size > EXCEL_MAX_BYTES) {
    return { ok: false, error: "Dosya boyutu 20 MB sınırını aşıyor." };
  }

  const buf = await file.arrayBuffer();
  const parsed = parseProductionExcelBuffer(buf);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  try {
    const { batchId } = await persistExcelImport(file.name, parsed.prepared);
    return { ok: true, batchId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt sırasında hata oluştu.";
    return { ok: false, error: msg };
  }
}
