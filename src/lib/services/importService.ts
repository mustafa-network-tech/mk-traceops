/** Excel şablonu — sütun başlıkları ve açıklamalar (import + UI). */
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
