import type { RoleKey } from "@/lib/rbac/types";

/** PostgreSQL app_role ↔ uygulama RoleKey */
const DB_TO_KEY: Record<string, RoleKey> = {
  platform_admin: "PLATFORM_ADMIN",
  company_admin: "COMPANY_ADMIN",
  production_user: "PRODUCTION_USER",
  warehouse_user: "WAREHOUSE_USER",
  shipment_user: "SHIPMENT_USER",
  viewer: "VIEWER",
};

const KEY_TO_DB: Record<RoleKey, string> = {
  PLATFORM_ADMIN: "platform_admin",
  COMPANY_ADMIN: "company_admin",
  PRODUCTION_USER: "production_user",
  WAREHOUSE_USER: "warehouse_user",
  SHIPMENT_USER: "shipment_user",
  VIEWER: "viewer",
};

export function dbRoleToRoleKey(db: string): RoleKey {
  const k = DB_TO_KEY[db];
  if (!k) throw new Error(`Bilinmeyen rol: ${db}`);
  return k;
}

export function roleKeyToDbRole(role: RoleKey): string {
  return KEY_TO_DB[role];
}
