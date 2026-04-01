/**
 * MK3Ops LİSTE Excel’indeki **sütun başlıkları** (GRUP, KODU, HAMMADDE, ROTA…) — sistem buna uyar.
 * `raw_data` yalnızca bu başlıklar + `_excel_row_kind`; `import-sync` aynı anahtarları okur (eski Parça Kodu şablonu yedek).
 * Tanınmayan ek sütunlar da Excel başlığıyla `raw_data`’ya yazılır (`excelParse`).
 */
export function getExpectedListeExcelColumns(): { key: string; aciklama: string }[] {
  return [
    { key: "GRUP", aciklama: "Montaj / proje grubu (Montaj Grubu olarak aktarılır)" },
    { key: "KODU", aciklama: "Parça veya kalem kodu — zorunlu (Parça Kodu)" },
    { key: "AÇIKLAMA", aciklama: "Tanım (Açıklama)" },
    { key: "ADET", aciklama: "Miktar (Adet)" },
    { key: "HAMMADDE", aciklama: "Malzeme cinsi / grade (Malzeme)" },
    { key: "HAMMADDE ÖLÇÜSÜ", aciklama: "Boyut (Ölçü)" },
    { key: "MALZEME ŞEKLİ", aciklama: "Profil, sac, çap vb. (ek bilgi)" },
    { key: "İMALAT ŞEKLİ", aciklama: "İmalat tipi; Operasyon yedekleri" },
    { key: "MLZM HMD TÜRÜ", aciklama: "Malzeme-hammadde türü" },
    { key: "SATINALMA TÜRÜ", aciklama: "Satın alma sınıfı" },
    { key: "İŞLEM TÜRÜ", aciklama: "İmalat / satın alma vb.; Operasyon yedeği" },
    {
      key: "BİRİM",
      aciklama: "Ham madde birimi (kg, adet, m…); boşsa HMD AĞIRLIK/ölçüden tahmin",
    },
    { key: "MIN STOK", aciklama: "Ham madde kartı minimum stok (opsiyonel)" },
    {
      key: "STOK MİKTARI",
      aciklama: "Ham madde mevcut stok — kartta Mevcut alanına yazılır (doluysa)",
    },
    { key: "HMD FİRMASI", aciklama: "Hammadde tedarikçüsü (Firma)" },
    { key: "HAMMADDE DURUMU", aciklama: "Durum notu" },
    { key: "MALZEME ÖZELLİK", aciklama: "Özellik" },
    { key: "FASON FİRMA", aciklama: "Fason firma (Firma yedeği)" },
    { key: "RESİM FARK", aciklama: "Resim farkı" },
    { key: "FASON DETAY", aciklama: "Fason detay" },
    { key: "MALZEME DETAY", aciklama: "Malzeme detay" },
    { key: "İŞLEM DURUMU", aciklama: "İşlem durumu" },
    { key: "AD HMD FİYAT", aciklama: "Hammadde fiyat notu" },
    { key: "HAMMADDE FİYAT", aciklama: "Hammadde fiyat" },
    { key: "FASON  GİDİŞ TARİH", aciklama: "Fason gidiş tarihi" },
    { key: "FASON GELİŞ TARİHİ", aciklama: "Fason geliş tarihi" },
    { key: "FASON FİYATI", aciklama: "Fason fiyatı (başta boşluklu başlık da eşlenir)" },
    { key: "TOPLAM FASON FİYAT", aciklama: "Toplam fason" },
    { key: "HMD AĞIRLIK", aciklama: "Ağırlık" },
    { key: "SATINALMA DURUMU", aciklama: "Satın alma durumu" },
    { key: "ROTA", aciklama: "Rota metni — öncelikli Operasyon alanı" },
  ];
}

/** Eski iki sayfalı şablon — 1. sayfa ana parçalar (isteğe bağlı yedek). */
export function getExpectedExcelColumns(): { key: string; aciklama: string }[] {
  return [
    { key: "Parça Kodu", aciklama: "Benzersiz parça kodu (zorunlu)" },
    { key: "Açıklama", aciklama: "Parça tanımı" },
    {
      key: "Malzeme",
      aciklama:
        "Ham madde adı (stok kartı). Excel’de «Ş» veya «Malzeme cinsi» başlığı da bu alana eşlenir.",
    },
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
      aciklama: "Stok kodu — Excel’deki değer aynen kullanılır (zorunlu)",
    },
    { key: "Ham Madde Adı", aciklama: "Tanım (zorunlu)" },
    {
      key: "Birim",
      aciklama: "Excel’de ne yazıyorsa o (kg, m, adet…); hücre boşsa adet",
    },
    { key: "Min Stok", aciklama: "Opsiyonel" },
    {
      key: "Mevcut Stok",
      aciklama: "Depo miktarı — panelde Mevcut sütununa yansır (opsiyonel)",
    },
    {
      key: "Firma",
      aciklama: "Tedarikçü adı (zorunlu) — malzeme–tedarikçü ilişkisi açılır",
    },
  ];
}

/** import_rows.raw_data içinde; Excel sütunu değil. */
export const EXCEL_ROW_KIND_KEY = "_excel_row_kind";
export type ExcelImportRowKind = "ana_parça" | "ham_madde";
