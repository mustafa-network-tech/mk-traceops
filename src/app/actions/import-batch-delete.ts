"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type DeleteImportBatchResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Test / temizlik: aktarım kaydı, ilişkili parçalar, bu batch’e bağlı montaj grupları
 * ve import satırları (batch silinince cascade) kaldırılır.
 * Malzeme ve tedarikçi kayıtları silinmez.
 */
export async function deleteImportBatchAction(
  batchId: string,
): Promise<DeleteImportBatchResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase yapılandırılmamış. NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error: partsErr } = await supabase
    .from("parts")
    .delete()
    .eq("import_batch_id", batchId);
  if (partsErr) return { ok: false, error: partsErr.message };

  const { error: agErr } = await supabase
    .from("assembly_groups")
    .delete()
    .eq("import_batch_id", batchId);
  if (agErr) return { ok: false, error: agErr.message };

  const { error: batchErr } = await supabase
    .from("import_batches")
    .delete()
    .eq("id", batchId);
  if (batchErr) return { ok: false, error: batchErr.message };

  revalidatePath("/aktarim-gecmisi");
  revalidatePath("/ana-parca-listesi");
  revalidatePath("/montaj-grup-takibi");
  revalidatePath("/kokpit");

  return { ok: true };
}
