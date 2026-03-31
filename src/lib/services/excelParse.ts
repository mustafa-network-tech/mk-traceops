import * as XLSX from "xlsx";

import type { ImportRowStatus } from "@/lib/types/models";

import {
  EXCEL_ROW_KIND_KEY,
  getExpectedExcelColumns,
  getExpectedHamMaddeExcelColumns,
  type ExcelImportRowKind,
} from "@/lib/services/importService";

export const EXCEL_MAX_BYTES = 20 * 1024 * 1024;
export const EXCEL_MAX_DATA_ROWS = 50_000;

function normalizeHeader(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

function canonicalAnaParcaKeys(): string[] {
  return getExpectedExcelColumns().map((c) => c.key);
}

function canonicalHamKeys(): string[] {
  return getExpectedHamMaddeExcelColumns().map((c) => c.key);
}

function matchCanonicalHeader(
  cellHeader: string,
  canonicalKeys: string[],
): string | null {
  const n = normalizeHeader(cellHeader);
  if (!n) return null;
  for (const key of canonicalKeys) {
    if (normalizeHeader(key) === n) return key;
  }
  return null;
}

/** Ham sayfası: mevcut/min stok için yaygın başlık eşlemeleri. */
const HAM_HEADER_SYNONYMS: Record<string, string> = {
  "mevcut stok": "Mevcut Stok",
  "güncel stok": "Mevcut Stok",
  "eldeki stok": "Mevcut Stok",
  "stok miktarı": "Mevcut Stok",
  "min stok": "Min Stok",
  "minimum stok": "Min Stok",
  "tedarikçü": "Firma",
  tedarikci: "Firma",
  "satıcı": "Firma",
  "satıcı firma": "Firma",
};

function matchHamCanonicalHeader(cellHeader: string): string | null {
  const direct = matchCanonicalHeader(cellHeader, canonicalHamKeys());
  if (direct) return direct;
  const n = normalizeHeader(cellHeader);
  return HAM_HEADER_SYNONYMS[n] ?? null;
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

function resolveHamSheetName(workbook: XLSX.WorkBook): string | null {
  const names = workbook.SheetNames;
  if (names.length < 2) return null;
  for (let i = 1; i < names.length; i++) {
    const x = normalizeHeader(names[i]);
    if (
      (x.includes("ham") && x.includes("madde")) ||
      x === "hammaddeler" ||
      x === "ham madde"
    ) {
      return names[i]!;
    }
  }
  if (names.length === 2) return names[1] ?? null;
  return null;
}

function parseSheetToRowsWithMap(
  sheet: XLSX.WorkSheet,
  matchHeader: (cellHeader: string) => string | null,
): {
  headerRow: unknown[];
  rows: unknown[][];
  colToCanonical: (string | null)[];
} {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];
  const headerRow = rows[0] ?? [];
  const colToCanonical: (string | null)[] = headerRow.map((h) =>
    typeof h === "string" || typeof h === "number"
      ? matchHeader(cellToString(h))
      : null,
  );
  return { headerRow, rows, colToCanonical };
}

function buildRawDataLine(
  line: unknown[] | undefined,
  headerRow: unknown[],
  colToCanonical: (string | null)[],
  rowKind: ExcelImportRowKind,
): { rawData: Record<string, string>; anyNonEmpty: boolean } {
  const rawData: Record<string, string> = {
    [EXCEL_ROW_KIND_KEY]: rowKind,
  };
  let anyNonEmpty = false;
  if (!line || !line.length) return { rawData, anyNonEmpty: false };
  const colCount = Math.max(line.length, colToCanonical.length);
  for (let c = 0; c < colCount; c++) {
    const canon = colToCanonical[c];
    const cellVal =
      line[c] == null || line[c] === "" ? "" : cellToString(line[c]);
    if (cellVal) anyNonEmpty = true;
    const headerCell =
      headerRow[c] == null ? "" : cellToString(headerRow[c]);
    const key = canon ?? (headerCell || `Sütun_${c + 1}`);
    rawData[key] = cellVal;
  }
  return { rawData, anyNonEmpty };
}

/**
 * 1. sayfa: ana parçalar (Parça Kodu zorunlu sütun).
 * 2. sayfa: "Ham Maddeler" adlı veya tek ek sayfa ise ham madde stok kartları.
 */
export function parseProductionExcelBuffer(buf: ArrayBuffer): ExcelParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: "array", cellDates: true });
  } catch {
    return {
      ok: false,
      error: "Excel dosyası okunamadı (bozuk veya desteklenmeyen format).",
    };
  }

  const anaSheetName = workbook.SheetNames[0];
  if (!anaSheetName)
    return { ok: false, error: "Çalışma sayfası bulunamadı." };

  const anaCanonical = canonicalAnaParcaKeys();
  const {
    headerRow: anaHeader,
    rows: anaRows,
    colToCanonical: anaColMap,
  } = parseSheetToRowsWithMap(workbook.Sheets[anaSheetName]!, (h) =>
    matchCanonicalHeader(h, anaCanonical),
  );

  if (!anaColMap.some((c) => c === "Parça Kodu")) {
    return {
      ok: false,
      error:
        'Birinci sayfada zorunlu sütun eksik: "Parça Kodu". Şablondaki başlık satırını kullanın.',
    };
  }

  const prepared: PreparedImportRow[] = [];
  let seq = 0;

  for (let i = 1; i < anaRows.length; i++) {
    const line = anaRows[i];
    const { rawData, anyNonEmpty } = buildRawDataLine(
      line as unknown[] | undefined,
      anaHeader,
      anaColMap,
      "ana_parça",
    );
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

  const hamSheet = resolveHamSheetName(workbook);
  if (hamSheet && workbook.Sheets[hamSheet]) {
    const {
      headerRow: hamHeader,
      rows: hamRows,
      colToCanonical: hamColMap,
    } = parseSheetToRowsWithMap(
      workbook.Sheets[hamSheet]!,
      matchHamCanonicalHeader,
    );

    if (!hamColMap.some((c) => c === "Ham Madde Adı")) {
      return {
        ok: false,
        error: `Ham madde sayfasında ("${hamSheet}") zorunlu sütun eksik: "Ham Madde Adı".`,
      };
    }
    if (!hamColMap.some((c) => c === "Ham Madde Kodu")) {
      return {
        ok: false,
        error: `Ham madde sayfasında ("${hamSheet}") zorunlu sütun eksik: "Ham Madde Kodu".`,
      };
    }
    if (!hamColMap.some((c) => c === "Firma")) {
      return {
        ok: false,
        error: `Ham madde sayfasında ("${hamSheet}") zorunlu sütun eksik: "Firma" (tedarikçü).`,
      };
    }

    for (let i = 1; i < hamRows.length; i++) {
      const line = hamRows[i];
      const { rawData, anyNonEmpty } = buildRawDataLine(
        line as unknown[] | undefined,
        hamHeader,
        hamColMap,
        "ham_madde",
      );
      if (!anyNonEmpty) continue;

      if (prepared.length >= EXCEL_MAX_DATA_ROWS) {
        return {
          ok: false,
          error: `En fazla ${EXCEL_MAX_DATA_ROWS.toLocaleString("tr-TR")} veri satırı yüklenebilir.`,
        };
      }

      seq += 1;
      const ad = (rawData["Ham Madde Adı"] ?? "").trim();
      if (!ad) {
        prepared.push({
          rowIndex: seq,
          rawData,
          status: "hata",
          message: "Ham Madde Adı boş olamaz.",
        });
        continue;
      }

      const kod = (rawData["Ham Madde Kodu"] ?? "").trim();
      if (!kod) {
        prepared.push({
          rowIndex: seq,
          rawData,
          status: "hata",
          message: "Ham Madde Kodu zorunlu (Excel’den).",
        });
        continue;
      }

      const firmaHm = (rawData["Firma"] ?? "").trim();
      if (!firmaHm) {
        prepared.push({
          rowIndex: seq,
          rawData,
          status: "hata",
          message: "Firma (tedarikçü) zorunlu.",
        });
        continue;
      }

      prepared.push({
        rowIndex: seq,
        rawData,
        status: "bekliyor",
      });
    }
  }

  if (prepared.length === 0) {
    return {
      ok: false,
      error:
        "İçe aktarılacak satır yok. Birinci sayfada parça satırları ve/veya ikinci sayfada ham madde satırları ekleyin.",
    };
  }

  return { ok: true, prepared };
}
