import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CHUNK = 200;

/**
 * Fabrika parça BOM dışa aktarımı: BOM_AYARLAR (dokümantasyon) + PARCA_BAGLANTI + PARCA_MALZEME.
 */
export async function GET() {
  const ctx = await getRbacSession();
  if (!ctx?.user || ctx.user.status !== "active") {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  if (!hasPermission(ctx, "parts_materials", "read")) {
    return NextResponse.json({ error: "Bu indirme için yetkiniz yok." }, { status: 403 });
  }
  const factoryId = ctx.user.factoryId;
  if (!factoryId) {
    return NextResponse.json(
      { error: "Yalnızca fabrika kullanıcıları bu dosyayı indirebilir." },
      { status: 403 },
    );
  }

  const factoryName = ctx.factory?.factoryName ?? "";
  const bomDepth = ctx.factory?.bomExplosionMaxDepth ?? 24;
  const exportedAtUtc = new Date().toISOString();

  const docOut: string[][] = [
    ["Alan", "Değer", "Açıklama"],
    ["Fabrika adı", factoryName, "Bu dosyanın üretildiği fabrika."],
    [
      "bom_explosion_max_depth",
      String(bomDepth),
      "explode_part_bom (MRP / üretim çıkışı patlatması) ve part_child_parts döngü kontrolü bu üst sınırı kullanır (köke göre seviye; DB’de 1–128). Panelde Ayarlar → BOM patlatma derinliği.",
    ],
    [
      "Veri sayfaları",
      "PARCA_BAGLANTI; PARCA_MALZEME",
      "Üst–alt parça kodları ve parça başına malzeme satırları. Bağlantı sayfası Excel içe aktarımıyla uyumludur.",
    ],
    ["Dışa aktarım zamanı (UTC)", exportedAtUtc, "Dosya oluşturulma zamanı."],
  ];

  const supabase = await createSupabaseServerClient();

  const { data: parts, error: pErr } = await supabase
    .from("parts")
    .select("id, part_code")
    .eq("factory_id", factoryId)
    .order("part_code");

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const partList = parts ?? [];
  const ids = partList.map((p) => p.id as string);
  const codeById = new Map(
    partList.map((p) => [p.id as string, String(p.part_code)]),
  );

  const linksOut: (string | number)[][] = [
    ["ÜST_KODU", "ALT_KODU", "ÜST_BASINA", "BİRİM"],
  ];

  const matOut: (string | number)[][] = [
    [
      "PARÇA_KODU",
      "MALZEME_KODU",
      "MALZEME_ADI",
      "MİKTAR_BİRİM_BAŞINA",
      "BİRİM",
    ],
  ];

  if (ids.length > 0) {
    type LinkRow = {
      parent_part_id: string;
      child_part_id: string;
      quantity_per_parent: number | string;
      unit: string | null;
    };
    const linkRows: LinkRow[] = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      const sl = ids.slice(i, i + CHUNK);
      const { data: ls } = await supabase
        .from("part_child_parts")
        .select("parent_part_id, child_part_id, quantity_per_parent, unit")
        .in("parent_part_id", sl);
      for (const r of (ls ?? []) as LinkRow[]) linkRows.push(r);
    }

    for (const L of linkRows) {
      const u = codeById.get(L.parent_part_id);
      const a = codeById.get(L.child_part_id);
      if (!u || !a) continue;
      linksOut.push([
        u,
        a,
        Number(L.quantity_per_parent),
        (L.unit && String(L.unit).trim()) || "adet",
      ]);
    }

    type PmRow = {
      part_id: string;
      material_id: string;
      quantity_per_unit: number | string;
      unit: string | null;
    };
    const pmRows: PmRow[] = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      const sl = ids.slice(i, i + CHUNK);
      const { data: pm } = await supabase
        .from("part_material_requirements")
        .select("part_id, material_id, quantity_per_unit, unit")
        .in("part_id", sl);
      for (const r of (pm ?? []) as PmRow[]) pmRows.push(r);
    }

    const matIds = [...new Set(pmRows.map((r) => r.material_id))];
    const matById = new Map<string, { code: string; name: string }>();
    for (let i = 0; i < matIds.length; i += CHUNK) {
      const sl = matIds.slice(i, i + CHUNK);
      const { data: mats } = await supabase
        .from("materials")
        .select("id, code, name")
        .in("id", sl)
        .eq("factory_id", factoryId);
      for (const m of mats ?? []) {
        matById.set(m.id as string, {
          code: String(m.code),
          name: String(m.name),
        });
      }
    }

    for (const r of pmRows) {
      const pc = codeById.get(r.part_id);
      const m = matById.get(r.material_id);
      if (!pc || !m) continue;
      matOut.push([
        pc,
        m.code,
        m.name,
        Number(r.quantity_per_unit),
        (r.unit && String(r.unit).trim()) || "adet",
      ]);
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(docOut),
    "BOM_AYARLAR",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(linksOut),
    "PARCA_BAGLANTI",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(matOut),
    "PARCA_MALZEME",
  );

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buf);
  const fname = `mk-traceops-bom-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
