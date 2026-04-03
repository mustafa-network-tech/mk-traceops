import type { ModuleKey, ActionKey } from "@/lib/rbac/modules";

/**
 * Panel rotaları → gerekli izin.
 * En uzun eşleşen prefix kazanır (sıralı kontrol).
 */
export const PANEL_ROUTE_RULES: {
  prefix: string;
  module: ModuleKey;
  action: ActionKey;
}[] = [
  { prefix: "/yonetim", module: "user_management", action: "read" },
  { prefix: "/kokpit", module: "dashboard", action: "read" },
  { prefix: "/excel-aktarim", module: "excel_import", action: "read" },
  { prefix: "/aktarim-gecmisi", module: "excel_import", action: "read" },
  { prefix: "/ana-parca-listesi", module: "parts_materials", action: "read" },
  { prefix: "/is-atama", module: "production_orders", action: "read" },
  { prefix: "/uretim-emirleri", module: "production_orders", action: "read" },
  { prefix: "/montaj-grup-takibi", module: "assembly_groups", action: "read" },
  { prefix: "/malzeme-yonetimi", module: "parts_materials", action: "read" },
  { prefix: "/ham-maddeler", module: "parts_materials", action: "read" },
  { prefix: "/sarf-malzemeler", module: "parts_materials", action: "read" },
  { prefix: "/tedarikciler", module: "suppliers", action: "read" },
  { prefix: "/malzeme-tedarikci", module: "suppliers", action: "read" },
  { prefix: "/stok-hareketleri", module: "stock_movements", action: "read" },
  { prefix: "/urun-kartlari", module: "warehouse_stock", action: "read" },
  { prefix: "/urun-stogu", module: "warehouse_stock", action: "read" },
  { prefix: "/sevkiyatlar", module: "shipments", action: "read" },
  { prefix: "/tekrar-eden-isler", module: "production_orders", action: "read" },
  { prefix: "/mrp", module: "mrp", action: "read" },
  { prefix: "/raporlama", module: "reports", action: "read" },
  { prefix: "/ayarlar", module: "company_settings", action: "read" },
];

export function requiredPermissionForPath(pathname: string): {
  module: ModuleKey;
  action: ActionKey;
} | null {
  let best: { prefix: string; module: ModuleKey; action: ActionKey } | null =
    null;
  for (const rule of PANEL_ROUTE_RULES) {
    if (
      pathname === rule.prefix ||
      pathname.startsWith(`${rule.prefix}/`)
    ) {
      if (!best || rule.prefix.length > best.prefix.length) {
        best = rule;
      }
    }
  }
  return best ? { module: best.module, action: best.action } : null;
}
