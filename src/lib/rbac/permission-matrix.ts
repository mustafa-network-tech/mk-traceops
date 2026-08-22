/**
 * Çalışma zamanı izinleri D1 `role_permissions` + `permissions` tablolarından yüklenir.
 * Bu matris yalnızca dokümantasyon ve migration ile hizalama içindir.
 */
import type { RoleKey } from "@/lib/rbac/types";
import type { ActionKey, ModuleKey } from "@/lib/rbac/modules";
import { permissionKey } from "@/lib/rbac/modules";

function P(module: ModuleKey, action: ActionKey): string {
  return permissionKey(module, action);
}

/** Rol → izin (referans; DB tek doğruluk kaynağı). */
export const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  PLATFORM_ADMIN: [
    P("platform_dashboard", "read"),
    P("factories", "read"),
    P("factories", "create"),
    P("factories", "update"),
    P("factories", "approve"),
    P("factories", "activate"),
    P("factories", "suspend"),
    P("licenses_packages", "read"),
    P("licenses_packages", "create"),
    P("licenses_packages", "update"),
    P("user_management", "read"),
    P("company_settings", "read"),
    P("invitations", "read"),
  ],
  COMPANY_ADMIN: [
    P("dashboard", "read"),
    P("excel_import", "read"),
    P("excel_import", "create"),
    P("excel_import", "update"),
    P("parts_materials", "read"),
    P("parts_materials", "create"),
    P("parts_materials", "update"),
    P("parts_materials", "delete"),
    P("assembly_groups", "read"),
    P("assembly_groups", "create"),
    P("assembly_groups", "update"),
    P("assembly_groups", "delete"),
    P("production_orders", "read"),
    P("production_orders", "create"),
    P("production_orders", "update"),
    P("production_orders", "delete"),
    P("warehouse_stock", "read"),
    P("warehouse_stock", "create"),
    P("warehouse_stock", "update"),
    P("warehouse_stock", "delete"),
    P("stock_movements", "read"),
    P("stock_movements", "create"),
    P("stock_movements", "update"),
    P("shipments", "read"),
    P("shipments", "create"),
    P("shipments", "update"),
    P("shipments", "delete"),
    P("suppliers", "read"),
    P("suppliers", "create"),
    P("suppliers", "update"),
    P("suppliers", "delete"),
    P("reports", "read"),
    P("mrp", "read"),
    P("user_management", "read"),
    P("user_management", "create"),
    P("user_management", "update"),
    P("user_management", "delete"),
    P("user_management", "assign_role"),
    P("invitations", "read"),
    P("invitations", "create"),
    P("invitations", "update"),
    P("company_settings", "read"),
    P("company_settings", "update"),
  ],
  PRODUCTION_USER: [
    P("dashboard", "read"),
    P("production_orders", "read"),
    P("production_orders", "create"),
    P("production_orders", "update"),
    P("parts_materials", "read"),
    P("assembly_groups", "read"),
    P("reports", "read"),
    P("mrp", "read"),
  ],
  WAREHOUSE_USER: [
    P("dashboard", "read"),
    P("warehouse_stock", "read"),
    P("warehouse_stock", "create"),
    P("warehouse_stock", "update"),
    P("stock_movements", "read"),
    P("stock_movements", "create"),
    P("stock_movements", "update"),
    P("parts_materials", "read"),
    P("reports", "read"),
    P("mrp", "read"),
  ],
  SHIPMENT_USER: [
    P("dashboard", "read"),
    P("shipments", "read"),
    P("shipments", "create"),
    P("shipments", "update"),
    P("warehouse_stock", "read"),
    P("reports", "read"),
    P("mrp", "read"),
  ],
  VIEWER: [P("dashboard", "read"), P("reports", "read")],
};

export function permissionsForRole(role: RoleKey): Set<string> {
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}
