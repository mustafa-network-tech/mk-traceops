/** Fabrika URL kodu: küçük harf, rakam ve tire; Türkçe harfler yakın ASCII’ye çevrilir. */
export function normalizeFactorySlug(raw: string): string {
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t;
}

export function isValidFactorySlug(slug: string): boolean {
  if (slug.length < 2 || slug.length > 48) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
