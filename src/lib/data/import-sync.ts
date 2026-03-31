import type { SupabaseClient } from "@supabase/supabase-js";

import { EXCEL_ROW_KIND_KEY } from "@/lib/services/importService";

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

/** Excel TR: 1.234,56 veya 1500,00 gibi biçimleri sayıya çevirir. */
function parseOptionalNumber(s: string): number {
  let t = s
    .trim()
    .replace(/\u00a0/g, "")
    .replace(/\s/g, "");
  if (!t) return 0;

  const hasComma = t.includes(",");
  const hasDot = t.includes(".");

  if (hasComma && hasDot) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    const last = t.lastIndexOf(",");
    const intPart = t.slice(0, last).replace(/\./g, "");
    const frac = t.slice(last + 1);
    if (
      frac.length > 0 &&
      frac.length <= 2 &&
      /^\d+$/.test(frac) &&
      /^\d+$/.test(intPart)
    ) {
      t = intPart + "." + frac;
    } else {
      t = t.replace(/,/g, "");
    }
  } else if (hasDot) {
    const parts = t.split(".");
    if (
      parts.length === 2 &&
      parts[1]!.length === 3 &&
      /^\d+$/.test(parts[0]!) &&
      /^\d+$/.test(parts[1]!)
    ) {
      t = parts[0]! + parts[1]!;
    }
  }

  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

async function ensureMaterialSupplierLink(
  supabase: SupabaseClient,
  materialId: string,
  firma: string,
  batchId: string,
): Promise<void> {
  if (!firma.trim()) return;

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

  if (!supplierId) return;

  const { data: relDup } = await supabase
    .from("material_supplier_relations")
    .select("id")
    .eq("material_id", materialId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (relDup) return;

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

/**
 * import_rows (bekliyor) → assembly_groups + materials + parts + tedarikçi /
 * malzeme–tedarikçi ilişkisi (Firma doluysa) + satır güncelleme.
 * Ham madde sayfası satırları yalnızca materials (+ isteğe bağlı ilişki) oluşturur.
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
    const rowKind = (rd[EXCEL_ROW_KIND_KEY] as string) || "ana_parça";

    if (rowKind === "ham_madde") {
      const hmAd = cell(rd, "Ham Madde Adı");
      if (!hmAd) {
        await supabase
          .from("import_rows")
          .update({
            status: "hata",
            message: "Ham Madde Adı zorunlu.",
          })
          .eq("id", row.id);
        continue;
      }

      const code = cell(rd, "Ham Madde Kodu");
      if (!code) {
        await supabase
          .from("import_rows")
          .update({
            status: "hata",
            message: "Ham Madde Kodu Excel’de zorunlu.",
          })
          .eq("id", row.id);
        continue;
      }

      const unitCell = cell(rd, "Birim");
      const unit = unitCell ? unitCell : "adet";
      const safeMin = parseOptionalNumber(cell(rd, "Min Stok"));
      const safeCur = parseOptionalNumber(cell(rd, "Mevcut Stok"));
      const firmaHm = cell(rd, "Firma");
      if (!firmaHm) {
        await supabase
          .from("import_rows")
          .update({
            status: "hata",
            message: "Firma (tedarikçü) zorunlu.",
          })
          .eq("id", row.id);
        continue;
      }

      let materialId: string | null = null;

      const { data: byCode } = await supabase
        .from("materials")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (byCode?.id) {
        materialId = byCode.id as string;
        const { error: upErr } = await supabase
          .from("materials")
          .update({
            name: hmAd,
            unit,
            min_stock: safeMin,
            current_stock: safeCur,
          })
          .eq("id", materialId);
        if (upErr) {
          await supabase
            .from("import_rows")
            .update({ status: "hata", message: upErr.message })
            .eq("id", row.id);
          continue;
        }
      } else {
        const { data: byName } = await supabase
          .from("materials")
          .select("id")
          .ilike("name", hmAd)
          .limit(1)
          .maybeSingle();

        if (byName?.id) {
          materialId = byName.id as string;
          const { error: upErr } = await supabase
            .from("materials")
            .update({
              code,
              name: hmAd,
              unit,
              min_stock: safeMin,
              current_stock: safeCur,
            })
            .eq("id", materialId);
          if (upErr) {
            await supabase
              .from("import_rows")
              .update({ status: "hata", message: upErr.message })
              .eq("id", row.id);
            continue;
          }
        } else {
          const { data: ins, error: insErr } = await supabase
            .from("materials")
            .insert({
              code,
              name: hmAd,
              type: "ham_madde",
              unit,
              min_stock: safeMin,
              current_stock: safeCur,
              active: true,
              category_id: categoryId,
              note: `Excel ham madde sayfası (${batchId})`,
            })
            .select("id")
            .single();
          if (insErr || !ins?.id) {
            await supabase
              .from("import_rows")
              .update({
                status: "hata",
                message: insErr?.message ?? "Ham madde eklenemedi.",
              })
              .eq("id", row.id);
            continue;
          }
          materialId = ins.id as string;
        }
      }

      if (materialId) {
        await ensureMaterialSupplierLink(
          supabase,
          materialId,
          firmaHm,
          batchId,
        );
      }

      await supabase
        .from("import_rows")
        .update({
          status: "işlendi",
          message: null,
          linked_part_id: null,
        })
        .eq("id", row.id);
      continue;
    }

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
      await ensureMaterialSupplierLink(supabase, materialId, firma, batchId);
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
