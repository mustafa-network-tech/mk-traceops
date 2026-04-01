import * as XLSX from "xlsx";

import type { ImportRowStatus } from "@/lib/types/models";

import { applyListeServerDerivations } from "@/lib/services/liste-import-derivations";
import {
  EXCEL_ROW_KIND_KEY,
  getExpectedExcelColumns,
  getExpectedHamMaddeExcelColumns,
  getExpectedListeExcelColumns,
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

/** LİSTE şablonu: normalize başlık → Excel’deki kanonik sütun adı. */
const LISTE_HEADER_NORMAL_TO_KEY: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const { key } of getExpectedListeExcelColumns()) {
    m[normalizeHeader(key)] = key;
  }
  return m;
})();

function matchListeCanonicalHeader(cellHeader: string): string | null {
  const n = normalizeHeader(cellHeader);
  if (!n) return null;
  return LISTE_HEADER_NORMAL_TO_KEY[n] ?? null;
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

/** Ham sayfası: şablondan sapmış başlıklar (normalizeHeader çıktısı → kanonik anahtar). */
const HAM_HEADER_SYNONYMS: Record<string, string> = {
  "mevcut stok": "Mevcut Stok",
  "güncel stok": "Mevcut Stok",
  "eldeki stok": "Mevcut Stok",
  "stok miktarı": "Mevcut Stok",
  miktar: "Mevcut Stok",
  "net miktar": "Mevcut Stok",
  "mevcut miktar": "Mevcut Stok",
  "stok adedi": "Mevcut Stok",
  "stok adet": "Mevcut Stok",
  "depo stok": "Mevcut Stok",
  "depo stoku": "Mevcut Stok",
  "fiziki stok": "Mevcut Stok",
  quantity: "Mevcut Stok",
  qty: "Mevcut Stok",
  stock: "Mevcut Stok",
  /** Sayım şablonlarında miktar sütunu sık “Adet” başlığıyla gelir (birim ayrı sütundaysa). */
  adet: "Mevcut Stok",
  "min stok": "Min Stok",
  "minimum stok": "Min Stok",
  "tedarikçü": "Firma",
  tedarikci: "Firma",
  "tedarikçi": "Firma",
  "satıcı": "Firma",
  "satıcı firma": "Firma",
  "stok kodu": "Ham Madde Kodu",
  "malzeme kodu": "Ham Madde Kodu",
  "ürün kodu": "Ham Madde Kodu",
  "malzeme adı": "Ham Madde Adı",
  "ürün adı": "Ham Madde Adı",
  tanım: "Ham Madde Adı",
  "ölçü birimi": "Birim",
  ölçübirimi: "Birim",
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

/**
 * Hücre değeri: sayı, metin veya SheetJS hücre nesnesi (formül + önbellek `v` / biçim `w`).
 * Formül metnini (=…) saklamıyoruz; mümkünse hesaplanmış sonucu okuruz.
 */
function cellToString(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "object" && v !== null) {
    const o = v as { w?: unknown; v?: unknown; f?: unknown };
    if (o.w != null && o.w !== "") return String(o.w).trim();
    if (o.v != null && o.v !== "") return cellToString(o.v);
  }
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

const HAM_HEADER_SCORE_KEYS = [
  "Ham Madde Kodu",
  "Ham Madde Adı",
  "Firma",
] as const;

/** İlk N satırda en çok zorunlu başlığı taşıyan satırı tablo başlığı say (üstte logo/birleşik hücre şablonları için). */
function parseHamSheetRows(
  sheet: XLSX.WorkSheet,
  matchHeader: (cellHeader: string) => string | null,
): {
  headerRow: unknown[];
  allRows: unknown[][];
  colToCanonical: (string | null)[];
  headerRowIndex: number;
} {
  const allRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (allRows.length === 0) {
    return {
      headerRow: [],
      allRows: [],
      colToCanonical: [],
      headerRowIndex: 0,
    };
  }

  const scan = Math.min(15, allRows.length);
  let bestIdx = 0;
  let bestScore = -1;
  for (let r = 0; r < scan; r++) {
    const row = allRows[r] ?? [];
    const colMap = row.map((h) =>
      typeof h === "string" || typeof h === "number"
        ? matchHeader(cellToString(h))
        : null,
    );
    const score = HAM_HEADER_SCORE_KEYS.filter((req) =>
      colMap.some((c) => c === req),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = r;
    }
  }

  const headerRow = allRows[bestIdx] ?? [];
  const colToCanonical = headerRow.map((h) =>
    typeof h === "string" || typeof h === "number"
      ? matchHeader(cellToString(h))
      : null,
  );

  return { headerRow, allRows, colToCanonical, headerRowIndex: bestIdx };
}

const LISTE_HEADER_SCORE_KEYS = ["KODU", "GRUP", "AÇIKLAMA"] as const;

function parseListeSheetRows(
  sheet: XLSX.WorkSheet,
  matchHeader: (cellHeader: string) => string | null,
): {
  headerRow: unknown[];
  allRows: unknown[][];
  colToCanonical: (string | null)[];
  headerRowIndex: number;
} {
  const allRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (allRows.length === 0) {
    return {
      headerRow: [],
      allRows: [],
      colToCanonical: [],
      headerRowIndex: 0,
    };
  }

  const scan = Math.min(15, allRows.length);
  let bestIdx = 0;
  let bestScore = -1;
  for (let r = 0; r < scan; r++) {
    const row = allRows[r] ?? [];
    const colMap = row.map((h) =>
      typeof h === "string" || typeof h === "number"
        ? matchHeader(cellToString(h))
        : null,
    );
    const score = LISTE_HEADER_SCORE_KEYS.filter((req) =>
      colMap.some((c) => c === req),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = r;
    }
  }

  const headerRow = allRows[bestIdx] ?? [];
  const colToCanonical = headerRow.map((h) =>
    typeof h === "string" || typeof h === "number"
      ? matchHeader(cellToString(h))
      : null,
  );

  return { headerRow, allRows, colToCanonical, headerRowIndex: bestIdx };
}

function findListeSheetInWorkbook(workbook: XLSX.WorkBook): {
  sheetName: string;
  headerRow: unknown[];
  allRows: unknown[][];
  colToCanonical: (string | null)[];
  headerRowIndex: number;
} | null {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const p = parseListeSheetRows(sheet, matchListeCanonicalHeader);
    if (p.colToCanonical.some((c) => c === "KODU")) {
      return { sheetName, ...p };
    }
  }
  return null;
}

function firstSheetHasLegacyParcaKodu(workbook: XLSX.WorkBook): boolean {
  const n0 = workbook.SheetNames[0];
  if (!n0) return false;
  const sheet = workbook.Sheets[n0];
  if (!sheet) return false;
  const { colToCanonical } = parseSheetToRowsWithMap(sheet, (h) =>
    matchCanonicalHeader(h, canonicalAnaParcaKeys()),
  );
  return colToCanonical.some((c) => c === "Parça Kodu");
}

function buildListeLineRecord(
  line: unknown[] | undefined,
  colToCanonical: (string | null)[],
): Record<string, string> {
  const row: Record<string, string> = {};
  if (!line?.length) return row;
  const colCount = Math.max(line.length, colToCanonical.length);
  for (let c = 0; c < colCount; c++) {
    const key = colToCanonical[c];
    if (!key) continue;
    const cellVal =
      line[c] == null || line[c] === "" ? "" : cellToString(line[c]);
    row[key] = cellVal;
  }
  return row;
}

/**
 * LİSTE sayfasında her sütun import_rows.raw_data içine girer:
 * tanınan başlık → kanonik anahtar; bilinmeyen → Excel başlığı veya `Sütun_N`.
 */
function buildListeLineRecordFull(
  line: unknown[] | undefined,
  headerRow: unknown[],
  colToCanonical: (string | null)[],
): Record<string, string> {
  const row: Record<string, string> = {};
  const colCount = Math.max(
    line?.length ?? 0,
    colToCanonical.length,
    headerRow.length,
  );
  for (let c = 0; c < colCount; c++) {
    const canon = colToCanonical[c];
    const headerCell =
      headerRow[c] == null ? "" : cellToString(headerRow[c]);
    const key = canon ?? (headerCell || `Sütun_${c + 1}`);
    const cellVal =
      line?.[c] == null || line?.[c] === "" ? "" : cellToString(line[c]!);
    row[key] = cellVal;
  }
  return row;
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

const XLSX_READ_MAX_ROWS = 100_000;

function appendHamMaddePreparedRows(
  workbook: XLSX.WorkBook,
  prepared: PreparedImportRow[],
  startSeq: number,
): { ok: true; seq: number } | { ok: false; error: string } {
  let seq = startSeq;
  const hamSheet = resolveHamSheetName(workbook);
  if (!hamSheet || !workbook.Sheets[hamSheet]) return { ok: true, seq };

  const {
    headerRow: hamHeader,
    allRows: hamRows,
    colToCanonical: hamColMap,
    headerRowIndex: hamHeaderIdx,
  } = parseHamSheetRows(workbook.Sheets[hamSheet]!, matchHamCanonicalHeader);

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

  for (let i = hamHeaderIdx + 1; i < hamRows.length; i++) {
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

  return { ok: true, seq };
}

/**
 * MK3Ops: «LİSTE» — `raw_data` yalnızca Excel sütun başlıkları + `_excel_row_kind` (Parça Kodu vb. eşlemesi yok).
 * `import-sync` KODU, GRUP, HAMMADDE… okur. Formül: hesaplanmış değer. Türev: `liste-import-derivations.ts`.
 *
 * Geçiş: 1. sayfada «Parça Kodu» varsa eski iki sayfalı şablon.
 * İkinci sayfa «Ham Maddeler» ise ham satırları her iki modda da eklenebilir.
 */
export function parseProductionExcelBuffer(buf: ArrayBuffer): ExcelParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, {
      type: "array",
      cellDates: true,
      sheetRows: XLSX_READ_MAX_ROWS,
    } satisfies XLSX.ParsingOptions);
  } catch {
    return {
      ok: false,
      error: "Excel dosyası okunamadı (bozuk veya desteklenmeyen format).",
    };
  }

  const firstName = workbook.SheetNames[0];
  if (!firstName)
    return { ok: false, error: "Çalışma sayfası bulunamadı." };

  const listeHit = findListeSheetInWorkbook(workbook);
  const legacyOnFirst = firstSheetHasLegacyParcaKodu(workbook);

  const useListe =
    listeHit &&
    !(
      legacyOnFirst &&
      listeHit.sheetName !== firstName &&
      normalizeHeader(listeHit.sheetName) !== "liste"
    );

  const prepared: PreparedImportRow[] = [];
  let seq = 0;

  if (useListe && listeHit) {
    const { headerRow, allRows, colToCanonical, headerRowIndex } = listeHit;
    if (!colToCanonical.some((c) => c === "KODU")) {
      return {
        ok: false,
        error: 'LİSTE şablonunda zorunlu sütun eksik: "KODU".',
      };
    }

    let emptyStreak = 0;
    const MAX_EMPTY_STREAK = 50;

    for (let i = headerRowIndex + 1; i < allRows.length; i++) {
      const line = allRows[i] as unknown[] | undefined;
      const fullListeRow = buildListeLineRecordFull(
        line,
        headerRow,
        colToCanonical,
      );
      const anyVal = Object.values(fullListeRow).some((v) => v.trim());
      if (!anyVal) {
        emptyStreak += 1;
        if (emptyStreak >= MAX_EMPTY_STREAK) break;
        continue;
      }
      emptyStreak = 0;

      const kodu = (fullListeRow["KODU"] ?? "").trim();
      if (!kodu) continue;

      if (prepared.length >= EXCEL_MAX_DATA_ROWS) {
        return {
          ok: false,
          error: `En fazla ${EXCEL_MAX_DATA_ROWS.toLocaleString("tr-TR")} veri satırı yüklenebilir.`,
        };
      }

      seq += 1;
      const derived = applyListeServerDerivations(fullListeRow);
      const rawData: Record<string, string> = {
        ...derived,
        [EXCEL_ROW_KIND_KEY]: "ana_parça",
      };
      const parca = (derived["KODU"] ?? "").trim();
      if (!parca) {
        prepared.push({
          rowIndex: seq,
          rawData,
          status: "hata",
          message: "KODU boş olamaz.",
        });
        continue;
      }

      prepared.push({
        rowIndex: seq,
        rawData,
        status: "bekliyor",
      });
    }
  } else {
    const anaCanonical = canonicalAnaParcaKeys();
    const {
      headerRow: anaHeader,
      rows: anaRows,
      colToCanonical: anaColMap,
    } = parseSheetToRowsWithMap(workbook.Sheets[firstName]!, (h) =>
      matchCanonicalHeader(h, anaCanonical),
    );

    if (!anaColMap.some((c) => c === "Parça Kodu")) {
      return {
        ok: false,
        error:
          'Excel’de ne LİSTE şablonu ("KODU" sütunu) ne de eski şablon ("Parça Kodu") bulundu. Başlık satırını kontrol edin.',
      };
    }

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
  }

  const hamAppend = appendHamMaddePreparedRows(workbook, prepared, seq);
  if (!hamAppend.ok) return { ok: false, error: hamAppend.error };
  seq = hamAppend.seq;

  if (prepared.length === 0) {
    return {
      ok: false,
      error:
        "İçe aktarılacak satır yok. LİSTE veya ana parça satırları ve/veya (varsa) ham madde sayfası ekleyin.",
    };
  }

  return { ok: true, prepared };
}
