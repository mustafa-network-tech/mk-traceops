import "server-only";

import type { Database } from "./database";

export type TenantContext = Readonly<{
  factoryId: string;
  actorId: string;
}>;

export class TenantBoundaryError extends Error {}

export abstract class TenantRepository {
  protected constructor(
    protected readonly db: Database,
    protected readonly tenant: TenantContext,
  ) {
    if (!tenant.factoryId || !tenant.actorId) {
      throw new TenantBoundaryError("factoryId ve actorId zorunludur.");
    }
  }

  protected statement(sql: string, ...values: unknown[]): D1PreparedStatement {
    return this.db.prepare(sql).bind(...values);
  }

  protected tenantStatement(sql: string, ...values: unknown[]): D1PreparedStatement {
    if (!/factory_id/i.test(sql)) {
      throw new TenantBoundaryError("Tenant sorgusu factory_id filtresi içermiyor.");
    }
    return this.statement(sql, this.tenant.factoryId, ...values);
  }
}

export function assertSameFactory(expected: string, actual: string | null | undefined): void {
  if (!actual || actual !== expected) {
    throw new TenantBoundaryError("Kayıt bu fabrikaya ait değil.");
  }
}
