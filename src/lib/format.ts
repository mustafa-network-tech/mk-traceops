import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(iso: string, pattern = "dd.MM.yyyy") {
  try {
    const d = iso.includes("T") ? parseISO(iso) : parseISO(`${iso}T12:00:00`);
    return format(d, pattern, { locale: tr });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "dd.MM.yyyy HH:mm", { locale: tr });
  } catch {
    return iso;
  }
}

export function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number, unit?: string) {
  const s = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 3,
  }).format(n);
  return unit ? `${s} ${unit}` : s;
}
