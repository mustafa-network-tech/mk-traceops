import type { ExcelImportPreviewRow } from "@/lib/types/models";

/** Gerçek XLS ayrıştırması buraya bağlanacak; şimdilik şablon satırları. */
export function getExpectedExcelColumns(): { key: string; aciklama: string }[] {
  return [
    { key: "Parça Kodu", aciklama: "Benzersiz parça kodu (zorunlu)" },
    { key: "Açıklama", aciklama: "Parça tanımı" },
    { key: "Malzeme", aciklama: "Ham madde / levha tanımı" },
    { key: "Ölçü", aciklama: "Boyutlar veya profil bilgisi" },
    { key: "Adet", aciklama: "Planlanan miktar" },
    { key: "Operasyon", aciklama: "Kesim, kaynak, montaj vb." },
    { key: "Montaj Grubu", aciklama: "MG- kodu veya grup adı" },
    { key: "Firma", aciklama: "Dış işlem firması (opsiyonel)" },
  ];
}

export function simulateImportPreview(): ExcelImportPreviewRow[] {
  return [
    {
      parcaKodu: "P-ALPHA-010",
      aciklama: "Yan kapak sacı",
      malzeme: "Dkp 2mm",
      olcu: "600x400",
      adet: "8",
      operasyon: "Lazer kesim",
      montajGrubu: "MG-ALPHA-02",
    },
    {
      parcaKodu: "P-ALPHA-011",
      aciklama: "Bağlantı braketi",
      malzeme: "Levha 10mm",
      olcu: "120x80",
      adet: "16",
      operasyon: "CNC",
      montajGrubu: "MG-ALPHA-02",
    },
    {
      parcaKodu: "P-BETA-120",
      aciklama: "Destek ayak profili",
      malzeme: "40x40 profil",
      olcu: "500mm",
      adet: "24",
      operasyon: "Profil kesim",
      montajGrubu: "MG-BETA-MAIN",
    },
  ];
}

export function simulateImportResult() {
  return {
    rowCount: 3,
    successCount: 3,
    errorCount: 0,
    message: "Önizleme başarılı — içe aktarma kuyruğa alındı (simülasyon).",
  };
}
