import "server-only";

import { dbRoleToRoleKey } from "@/lib/rbac/role-map";
import type { Factory, RbacSessionContext, RbacUser } from "@/lib/rbac/types";
import type { Database } from "../database";

type SessionRow = {
  id: string;
  factory_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  profile_status: RbacUser["status"];
  profile_created_at: string;
  factory_name: string | null;
  factory_slug: string | null;
  factory_status: Factory["status"] | null;
  package_status: string | null;
  factory_created_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  bom_explosion_max_depth: number | null;
};

export class RbacSessionRepository {
  constructor(private readonly db: Database) {}

  async findContext(profileId: string): Promise<RbacSessionContext | null> {
    const row = await this.db.prepare(
      `SELECT p.id,p.factory_id,p.email,p.first_name,p.last_name,p.phone,p.role,
              p.status AS profile_status,p.created_at AS profile_created_at,
              f.name AS factory_name,f.slug AS factory_slug,f.status AS factory_status,
              f.package_status,f.created_at AS factory_created_at,f.approved_by,f.approved_at,
              f.bom_explosion_max_depth
       FROM profiles p
       LEFT JOIN factories f ON f.id=p.factory_id
       WHERE p.id=? LIMIT 1`,
    ).bind(profileId).first<SessionRow>();
    if (!row) return null;

    const user: RbacUser = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone ?? undefined,
      role: dbRoleToRoleKey(row.role),
      factoryId: row.factory_id,
      status: row.profile_status,
      createdAt: row.profile_created_at,
    };
    const factory: Factory | null = row.factory_id && row.factory_name && row.factory_slug && row.factory_status
      ? {
          id: row.factory_id,
          factoryName: row.factory_name,
          factorySlug: row.factory_slug,
          status: row.factory_status,
          packageStatus: row.package_status ?? "none",
          createdAt: row.factory_created_at ?? row.profile_created_at,
          approvedByPlatformAdminId: row.approved_by ?? undefined,
          approvedAt: row.approved_at ?? undefined,
          bomExplosionMaxDepth: row.bom_explosion_max_depth ?? 24,
        }
      : null;

    const permissionRows = await this.db.prepare(
      `SELECT p.module,p.action
       FROM role_permissions rp
       JOIN permissions p ON p.id=rp.permission_id
       WHERE rp.role=?`,
    ).bind(row.role).all<{ module: string; action: string }>();
    return {
      user,
      factory,
      permissions: new Set(permissionRows.results.map((p) => `${p.module}.${p.action}`)),
    };
  }

  async listActorOptions(): Promise<Array<{ id: string; label: string; role: RbacUser["role"] }>> {
    const rows = await this.db.prepare(
      `SELECT id,email,first_name,last_name,role
       FROM profiles WHERE status='active' ORDER BY created_at,id`,
    ).all<{ id: string; email: string; first_name: string; last_name: string; role: string }>();
    return rows.results.map((p) => {
      const role = dbRoleToRoleKey(p.role);
      const name = `${p.first_name} ${p.last_name}`.trim();
      return { id: p.id, role, label: role === "PLATFORM_ADMIN" ? name : `${name} · ${p.email}` };
    });
  }
}
