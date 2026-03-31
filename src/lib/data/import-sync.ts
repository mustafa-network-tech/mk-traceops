import type { SupabaseClient } from "@supabase/supabase-js";

/** Excel ham alanlarından metin (jsonb içinden de gelebilir). */
function cell(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  if (v == null) return "";
  return String(v).trim();
}

function materialCodeFromName(name: string): string {
  const slug = name
    .trim()
    .slice(0, 32)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-ğüşıöçĞÜŞİÖÇ]/g, "");
  const tail = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HM-${slug || "OTO"}-${tail}`;
}

/**
 * import_rows (bekliyor) → assembly_groups + materials + parts + tedarikçi /
 * malzeme–tedarikçi ilişkisi (Firma doluysa) + satır güncelleme.
 */
export async function syncPartsFromImportBatch(
  supabase: SupabaseClient,
  batchId: string,
): Promise<void> {
  const { data: cat, error: catErr } = await supabase
    .from("material_categories")
    .select("id")
    .eq("code", "GEN")
    .maybeSingle();

  if (catErr) throw new Error(catErr.message);
  let categoryId = cat?.id as string | undefined;
  if (!categoryId) {
    const { data: ins, error: insErr } = await supabase
      .from("material_categories")
      .insert({ name: "Genel", code: "GEN" })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    categoryId = ins!.id as string;
  }

  const { data: rows, error: rowErr } = await supabase
    .from("import_rows")
    .select("id, raw_data, status")
    .eq("batch_id", batchId)
    .eq("status", "bekliyor");

  if (rowErr) throw new Error(rowErr.message);

  for (const row of rows ?? []) {
    const rd = row.raw_data as Record<string, unknown>;
    const montaj = cell(rd, "Montaj Grubu");
    const partCode = cell(rd, "Parça Kodu");
    if (!partCode) continue;

    let assemblyGroupId: string | null = null;
    if (montaj) {
      const { data: existingAg } = await supabase
        .from("assembly_groups")
        .select("id")
        .eq("import_batch_id", batchId)
        .eq("code", montaj)
        .maybeSingle();

      if (existingAg?.id) {
        assemblyGroupId = existingAg.id as string;
      } else {
        const { data: agIns, error: agErr } = await supabase
          .from("assembly_groups")
          .insert({
            code: montaj,
            name: montaj,
            import_batch_id: batchId,
          })
          .select("id")
          .single();
        if (agErr) {
          await supabase
            .from("import_rows")
            .update({
              status: "hata",
              message: `Montaj grubu oluşturulamadı: ${agErr.message}`,
            })
            .eq("id", row.id);
          continue;
        }
        assemblyGroupId = agIns!.id as string;
      }
    }

    let materialId: string | null = null;
    const malzemeAd = cell(rd, "Malzeme");
    if (malzemeAd) {
      const { data: matHit } = await supabase
        .from("materials")
        .select("id")
        .ilike("name", malzemeAd)
        .limit(1)
        .maybeSingle();

      if (matHit?.id) {
        materialId = matHit.id as string;
      } else {
        const { data: matIns, error: matErr } = await supabase
          .from("materials")
          .insert({
            code: materialCodeFromName(malzemeAd),
            name: malzemeAd,
            type: "ham_madde",
            unit: "adet",
            min_stock: 0,
            current_stock: 0,
            active: true,
            category_id: categoryId,
            note: `Excel aktarımı (${batchId})`,
          })
          .select("id")
          .single();
        if (!matErr && matIns?.id) materialId = matIns.id as string;
      }
    }

    let assignedCompanyId: string | null = null;
    const firma = cell(rd, "Firma");
    if (firma) {
      const { data: co } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", firma)
        .limit(1)
        .maybeSingle();
      if (co?.id) assignedCompanyId = co.id as string;
    }

    const qtyRaw = cell(rd, "Adet");
    const quantity = qtyRaw ? Number(qtyRaw.replace(",", ".")) : 0;
    const safeQty = Number.isFinite(quantity) ? quantity : 0;

    const { data: partIns, error: partErr } = await supabase
      .from("parts")
      .insert({
        import_batch_id: batchId,
        import_row_id: row.id,
        part_code: partCode,
        description: cell(rd, "Açıklama"),
        material_id: materialId,
        dimensions: cell(rd, "Ölçü") || null,
        quantity: safeQty,
        operation: cell(rd, "Operasyon"),
        assigned_company_id: assignedCompanyId,
        assembly_group_id: assemblyGroupId,
        type: "ana_parça",
      })
      .select("id")
      .single();

    if (partErr || !partIns?.id) {
      await supabase
        .from("import_rows")
        .update({
          status: "hata",
          message: partErr?.message ?? "Parça kaydı oluşturulamadı.",
        })
        .eq("id", row.id);
      continue;
    }

    const partId = partIns.id as string;

    if (materialId && firma) {
      let supplierId: string | null = null;
      const { data: supHit } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", firma)
        .limit(1)
        .maybeSingle();

      if (supHit?.id) {
        supplierId = supHit.id as string;
      } else {
        const { data: supIns, error: supErr } = await supabase
          .from("suppliers")
          .insert({
            name: firma,
            notes: `Excel aktarımı (${batchId})`,
          })
          .select("id")
          .single();
        if (!supErr && supIns?.id) supplierId = supIns.id as string;
      }

      if (supplierId) {
        const { data: relDup } = await supabase
          .from("material_supplier_relations")
          .select("id")
          .eq("material_id", materialId)
          .eq("supplier_id", supplierId)
          .maybeSingle();

        if (!relDup) {
          const { count: matRelCount } = await supabase
            .from("material_supplier_relations")
            .select("*", { count: "exact", head: true })
            .eq("material_id", materialId);

          const n = matRelCount ?? 0;
          await supabase.from("material_supplier_relations").insert({
            material_id: materialId,
            supplier_id: supplierId,
            last_purchase_price: 0,
            currency: "TRY",
            last_purchase_date: new Date().toISOString().slice(0, 10),
            is_primary: n === 0,
            priority_order: n,
          });
        }
      }
    }

    await supabase
      .from("import_rows")
      .update({
        linked_part_id: partId,
        status: "işlendi",
        message: null,
      })
      .eq("id", row.id);
  }

  const { count: successAfter } = await supabase
    .from("import_rows")
    .select("*", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .eq("status", "işlendi");

  const { count: errorAfter } = await supabase
    .from("import_rows")
    .select("*", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .eq("status", "hata");

  const ok = successAfter ?? 0;
  const err = errorAfter ?? 0;
  const status = err === 0 ? "tamamlandı" : "kısmi_hata";

  await supabase
    .from("import_batches")
    .update({
      success_count: ok,
      error_count: err,
      status,
    })
    .eq("id", batchId);
}
