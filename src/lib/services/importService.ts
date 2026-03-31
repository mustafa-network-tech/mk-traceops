/** 1. çalışma sayfası — ana parça üretim satırları. */
export function getExpectedExcelColumns(): { key: string; aciklama: string }[] {
  return [
    { key: "Parça Kodu", aciklama: "Benzersiz parça kodu (zorunlu)" },
    { key: "Açıklama", aciklama: "Parça tanımı" },
    { key: "Malzeme", aciklama: "Kullanılan ham madde adı (stok kartına bağlanır)" },
    { key: "Ölçü", aciklama: "Boyutlar veya profil bilgisi" },
    { key: "Adet", aciklama: "Planlanan miktar" },
    { key: "Operasyon", aciklama: "Kesim, kaynak, montaj vb." },
    { key: "Montaj Grubu", aciklama: "MG- kodu veya grup adı" },
    { key: "Firma", aciklama: "Dış işlem / tedarikçü (opsiyonel)" },
  ];
}

/**
 * 2. çalışma sayfası — yalnızca stok kartı (ham madde). Sayfa adı: "Ham Maddeler" vb.
 */
export function getExpectedHamMaddeExcelColumns(): {
  key: string;
  aciklama: string;
}[] {
  return [
    {
      key: "Ham Madde Kodu",
      aciklama: "Stok kodu (boşsa otomatik HM-… üretilir)",
    },
    { key: "Ham Madde Adı", aciklama: "Tanım — zorunlu" },
    { key: "Birim", aciklama: "kg, m, adet… (varsayılan adet)" },
    { key: "Min Stok", aciklama: "Opsiyonel" },
    { key: "Mevcut Stok", aciklama: "Opsiyonel" },
    { key: "Firma", aciklama: "Tedarikçü (opsiyonel, ilişki açılır)" },
  ];
}

/** import_rows.raw_data içinde; Excel sütunu değil. */
export const EXCEL_ROW_KIND_KEY = "_excel_row_kind";
export type ExcelImportRowKind = "ana_parça" | "ham_madde";
