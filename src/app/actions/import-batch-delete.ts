"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type DeleteImportBatchResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Aktarım silme: öncelikle DB’deki `delete_import_batch_cascade` (migration)
 * — parçalar, BOM/rota satırları (cascade), gruplar, yalnızca bu batch ile
 * oluşmuş ve başka yerde kullanılmayan malzemeler, ardından batch + import_rows.
 * Fonksiyon yoksa eski sıra ile silinir (malzeme temizliği olmadan).
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

  const { error: rpcErr } = await supabase.rpc("delete_import_batch_cascade", {
    p_batch_id: batchId,
  });

  const useLegacy =
    rpcErr &&
    (rpcErr.code === "PGRST202" ||
      /delete_import_batch_cascade|function.*not found|schema cache/i.test(
        rpcErr.message ?? "",
      ));

  if (rpcErr && !useLegacy) {
    return { ok: false, error: rpcErr.message };
  }

  if (useLegacy) {
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
  }

  revalidatePath("/aktarim-gecmisi");
  revalidatePath(`/aktarim-gecmisi/${batchId}`);
  revalidatePath("/excel-aktarim");
  revalidatePath("/ana-parca-listesi");
  revalidatePath("/montaj-grup-takibi");
  revalidatePath("/malzeme-yonetimi");
  revalidatePath("/ham-maddeler");
  revalidatePath("/kokpit");

  return { ok: true };
}
