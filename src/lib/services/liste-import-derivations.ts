/**
 * LİSTE Excel → import_rows.raw_data
 *
 * **Formüller:** .xlsx dosyası hücrede genelde son *hesaplanmış değeri* (cached `v` / biçimli `w`)
 * saklar. `sheet_to_json` ile `raw: false` kullanıldığında bu görünen değer okunur.
 * Excel’i kaydederken “Çalışma Kitabı Hesaplaması” açık olsun; aksi halde eski önbellek yazılır.
 *
 * Excel’deki formülü tam olarak tekrarlamak gerektiğinde (ör. özel birim, birleşik metin)
 * bu modülde `row` üzerinde dönüşüm yapın; çıktı `import_rows.raw_data` ile aynı anahtarları kullanır.
 */
export function applyListeServerDerivations(
  row: Record<string, string>,
): Record<string, string> {
  return { ...row };
}
