import "server-only";

import { getDatabase } from "@/lib/d1/database";
import { PartsOverviewRepository } from "@/lib/d1/repositories/parts-overview";
import type { RbacSessionContext } from "@/lib/rbac/types";

export async function getPartsPageData(ctx: RbacSessionContext | null) {
  const factoryId = ctx?.user.factoryId;
  if (!ctx?.user.id || !factoryId) {
    return { parts: [], materials: [], companies: [], assemblies: [], childLinks: [] };
  }
  const repository = new PartsOverviewRepository(getDatabase(), { factoryId, actorId: ctx.user.id });
  const [parts, materials, companies, assemblies, childLinks] = await Promise.all([
    repository.listParts(), repository.listMaterials(), repository.listCompanies(),
    repository.listAssemblyGroups(), repository.listChildLinks(),
  ]);
  return { parts, materials, companies, assemblies, childLinks };
}
