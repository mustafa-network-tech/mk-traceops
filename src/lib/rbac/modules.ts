/** İzin modülü (platform + fabrika). */
export type ModuleKey =
  | "platform_dashboard"
  | "factories"
  | "licenses_packages"
  | "company_settings"
  | "user_management"
  | "invitations"
  | "dashboard"
  | "excel_import"
  | "parts_materials"
  | "assembly_groups"
  | "production_orders"
  | "warehouse_stock"
  | "stock_movements"
  | "shipments"
  | "suppliers"
  | "reports";

/** İzin eylemi. */
export type ActionKey =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "invite"
  | "assign_role"
  | "approve"
  | "activate"
  | "suspend";

export function permissionKey(module: ModuleKey, action: ActionKey): string {
  return `${module}.${action}`;
}
