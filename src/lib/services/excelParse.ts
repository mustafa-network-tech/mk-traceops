import * as XLSX from "xlsx";

import type { ImportRowStatus } from "@/lib/types/models";

import { getExpectedExcelColumns } from "@/lib/services/importService";

export const EXCEL_MAX_BYTES = 20 * 1024 * 1024;
export const EXCEL_MAX_DATA_ROWS = 50_000;

function normalizeHeader(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

/** Beklenen sütun başlıkları (şablondaki ile aynı sıra). */
function canonicalHeaders(): string[] {
  return getExpectedExcelColumns().map((c) => c.key);
}

function matchCanonicalHeader(cellHeader: string): string | null {
  const n = normalizeHeader(cellHeader);
  if (!n) return null;
  for (const key of canonicalHeaders()) {
    if (normalizeHeader(key) === n) return key;
  }
  return null;
}

export type PreparedImportRow = {
  rowIndex: number;
  rawData: Record<string, string>;
  status: ImportRowStatus;
  message?: string;
};

function cellToString(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(v);
  return String(v).trim();
}

export type ExcelParseResult =
  | { ok: false; error: string }
  | { ok: true; prepared: PreparedImportRow[] };

/**
 * İlk sayfa, ilk satır başlık. Zorunlu sütun: "Parça Kodu".
 */
export function parseProductionExcelBuffer(buf: ArrayBuffer): ExcelParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: "array", cellDates: true });
  } catch {
    return { ok: false, error: "Excel dosyası okunamadı (bozuk veya desteklenmeyen format)." };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: false, error: "Çalışma sayfası bulunamadı." };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!rows.length)
    return { ok: false, error: "Dosyada satır yok." };

  const headerRow = rows[0] ?? [];
  const colToCanonical: (string | null)[] = headerRow.map((h) =>
    typeof h === "string" || typeof h === "number"
      ? matchCanonicalHeader(cellToString(h))
      : null,
  );

  if (!colToCanonical.some((c) => c === "Parça Kodu")) {
    return {
      ok: false,
      error:
        'Zorunlu sütun eksik: "Parça Kodu". Şablondaki başlık satırını kullanın.',
    };
  }

  const prepared: PreparedImportRow[] = [];
  let seq = 0;
  for (let i = 1; i < rows.length; i++) {
    const line = rows[i];
    if (!line || !line.length) continue;

    const rawData: Record<string, string> = {};
    let anyNonEmpty = false;
    const colCount = Math.max(line.length, colToCanonical.length);
    for (let c = 0; c < colCount; c++) {
      const canon = colToCanonical[c];
      const cellVal =
        line[c] == null || line[c] === ""
          ? ""
          : cellToString(line[c]);
      if (cellVal) anyNonEmpty = true;
      const headerCell =
        headerRow[c] == null ? "" : cellToString(headerRow[c]);
      const key = canon ?? (headerCell || `Sütun_${c + 1}`);
      rawData[key] = cellVal;
    }

    if (!anyNonEmpty) continue;

    if (prepared.length >= EXCEL_MAX_DATA_ROWS) {
      return {
        ok: false,
        error: `En fazla ${EXCEL_MAX_DATA_ROWS.toLocaleString("tr-TR")} veri satırı yüklenebilir.`,
      };
    }

    seq += 1;

    const parca = (rawData["Parça Kodu"] ?? "").trim();
    if (!parca) {
      prepared.push({
        rowIndex: seq,
        rawData,
        status: "hata",
        message: "Parça Kodu boş olamaz.",
      });
      continue;
    }

    prepared.push({
      rowIndex: seq,
      rawData,
      status: "bekliyor",
    });
  }

  if (prepared.length === 0)
    return { ok: false, error: "İçe aktarılacak dolu satır bulunamadı." };

  return { ok: true, prepared };
}
