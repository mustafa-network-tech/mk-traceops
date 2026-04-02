import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dbRoleToRoleKey, roleKeyToDbRole } from "@/lib/rbac/role-map";
import type {
  Factory,
  FactoryRequest,
  Invitation,
  RbacSessionContext,
  RbacUser,
  RoleKey,
  SubscriptionRecord,
} from "@/lib/rbac/types";

type ProfileRow = {
  id: string;
  factory_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
};

function mapFactory(r: Record<string, unknown>): Factory {
  return {
    id: r.id as string,
    factoryName: r.name as string,
    factorySlug: r.slug as string,
    status: r.status as Factory["status"],
    packageStatus: (r.package_status as string) ?? "",
    createdAt: r.created_at as string,
    approvedByPlatformAdminId: (r.approved_by as string) ?? undefined,
    approvedAt: (r.approved_at as string) ?? undefined,
  };
}

function mapProfileToRbacUser(r: ProfileRow): RbacUser {
  return {
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone ?? undefined,
    role: dbRoleToRoleKey(r.role),
    factoryId: r.factory_id,
    status: r.status as RbacUser["status"],
    createdAt: r.created_at,
  };
}

function mapInvitation(r: Record<string, unknown>): Invitation {
  return {
    id: r.id as string,
    factoryId: r.factory_id as string,
    email: r.email as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    phone: (r.phone as string) ?? undefined,
    role: dbRoleToRoleKey(r.role as string) as Invitation["role"],
    status: r.status as Invitation["status"],
    invitedByUserId: r.invited_by as string,
    createdAt: r.created_at as string,
    token: r.token as string,
  };
}

function mapSubscription(r: Record<string, unknown>): SubscriptionRecord {
  return {
    id: r.id as string,
    factoryId: r.factory_id as string,
    planCode: r.plan_code as string,
    status: r.status as string,
    trialEndsAt: (r.trial_ends_at as string) ?? undefined,
  };
}

/** Okumalar / çoğu yazma: oturum veya anon + geliştirme RLS. */
async function db() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseServerClient();
}

/** Auth Admin API (createUser / deleteUser) — SUPABASE_SERVICE_ROLE_KEY gerekir. */
async function admin() {
  if (!isSupabaseAdminConfigured()) return null;
  return createSupabaseAdminClient();
}

export async function loadPermissionSetForDbRole(
  dbRole: string,
): Promise<Set<string>> {
  const c = await db();
  if (!c) return new Set();
  const { data, error } = await c
    .from("role_permissions")
    .select("permissions(module, action)")
    .eq("role", dbRole);
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const row of data ?? []) {
    const raw = row.permissions as unknown;
    const p = Array.isArray(raw)
      ? (raw[0] as { module: string; action: string } | undefined)
      : (raw as { module: string; action: string } | null);
    if (p?.module && p?.action) set.add(`${p.module}.${p.action}`);
  }
  return set;
}

export async function getSessionContextByProfileId(
  profileId: string,
): Promise<RbacSessionContext | null> {
  const c = await db();
  if (!c) return null;
  const { data: prof, error: pe } = await c
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (pe) throw new Error(pe.message);
  if (!prof) return null;
  const user = mapProfileToRbacUser(prof as unknown as ProfileRow);
  let factory: Factory | null = null;
  if (user.factoryId) {
    const { data: fac, error: fe } = await c
      .from("factories")
      .select("*")
      .eq("id", user.factoryId)
      .maybeSingle();
    if (fe) throw new Error(fe.message);
    if (fac) factory = mapFactory(fac as Record<string, unknown>);
  }
  const permissions = await loadPermissionSetForDbRole(roleKeyToDbRole(user.role));
  return { user, factory, permissions };
}

export async function getProfileById(
  id: string,
): Promise<RbacUser | undefined> {
  const c = await db();
  if (!c) return undefined;
  const { data, error } = await c
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return mapProfileToRbacUser(data as unknown as ProfileRow);
}

export async function listProfilesForSwitcher(): Promise<RbacUser[]> {
  const c = await db();
  if (!c) return [];
  const { data, error } = await c
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(mapProfileToRbacUser);
}

export async function listFactories(): Promise<Factory[]> {
  const c = await db();
  if (!c) return [];
  const { data, error } = await c
    .from("factories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map(mapFactory);
}

export async function getFactoryById(id: string): Promise<Factory | undefined> {
  const c = await db();
  if (!c) return undefined;
  const { data, error } = await c
    .from("factories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapFactory(data as Record<string, unknown>) : undefined;
}

export async function listAllFactoryRequests(): Promise<FactoryRequest[]> {
  const c = await db();
  if (!c) return [];
  const { data, error } = await c
    .from("factory_registration_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    requestedFactoryName: r.requested_factory_name as string,
    requestedSlug: r.requested_slug as string,
    applicantEmail: r.applicant_email as string,
    applicantName: r.applicant_name as string,
    status: r.status as FactoryRequest["status"],
    createdAt: r.created_at as string,
  }));
}

export async function listPendingFactoryRequests(): Promise<FactoryRequest[]> {
  const all = await listAllFactoryRequests();
  return all.filter((x) => x.status === "pending");
}

export async function rejectFactoryRequest(
  requestId: string,
  platformAdminId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { error } = await c
    .from("factory_registration_requests")
    .update({
      status: "rejected",
      processed_at: new Date().toISOString(),
      processed_by: platformAdminId,
    })
    .eq("id", requestId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function approveFactoryRequest(params: {
  requestId: string;
  platformAdminId: string;
  firstAdminEmail: string;
  firstAdminFirstName: string;
  firstAdminLastName: string;
  firstAdminPhone?: string;
  packageStatus?: string;
}): Promise<{ ok: true; factoryId: string } | { ok: false; error: string }> {
  const d = await db();
  const adm = await admin();
  if (!d) return { ok: false, error: "Supabase yapılandırılmamış." };
  if (!adm) {
    return {
      ok: false,
      error:
        "İlk yönetici oluşturmak için SUPABASE_SERVICE_ROLE_KEY (Auth Admin) gerekli.",
    };
  }

  const { data: req, error: re } = await d
    .from("factory_registration_requests")
    .select("*")
    .eq("id", params.requestId)
    .eq("status", "pending")
    .maybeSingle();
  if (re) return { ok: false, error: re.message };
  if (!req) return { ok: false, error: "Talep bulunamadı veya işlenmiş." };

  const slug = (req as { requested_slug: string }).requested_slug;
  const name = (req as { requested_factory_name: string }).requested_factory_name;

  const { data: slugHit } = await d
    .from("factories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugHit) return { ok: false, error: "Bu slug zaten kullanılıyor." };

  const tempPassword =
    `${crypto.randomUUID().replaceAll("-", "")}Aa1!`;

  const { data: authData, error: authErr } = await adm.auth.admin.createUser({
    email: params.firstAdminEmail.trim().toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: params.firstAdminFirstName.trim(),
      last_name: params.firstAdminLastName.trim(),
    },
  });
  if (authErr || !authData.user) {
    return { ok: false, error: authErr?.message ?? "Auth kullanıcı oluşturulamadı." };
  }
  const newUserId = authData.user.id;

  const now = new Date().toISOString();
  const pkg = params.packageStatus?.trim() || "trial";

  const { data: fac, error: fe } = await d
    .from("factories")
    .insert({
      name,
      slug,
      status: "active",
      package_status: pkg,
      approved_by: params.platformAdminId,
      approved_at: now,
    })
    .select("id")
    .single();
  if (fe || !fac) {
    await adm.auth.admin.deleteUser(newUserId);
    return { ok: false, error: fe?.message ?? "Fabrika oluşturulamadı." };
  }
  const factoryId = fac.id as string;

  const { error: pe } = await d.from("profiles").insert({
    id: newUserId,
    factory_id: factoryId,
    email: params.firstAdminEmail.trim().toLowerCase(),
    first_name: params.firstAdminFirstName.trim(),
    last_name: params.firstAdminLastName.trim(),
    phone: params.firstAdminPhone?.trim() ?? null,
    role: "company_admin",
    status: "active",
  });
  if (pe) {
    await d.from("factories").delete().eq("id", factoryId);
    await adm.auth.admin.deleteUser(newUserId);
    return { ok: false, error: pe.message };
  }

  const { error: se } = await d.from("factory_subscriptions").insert({
    factory_id: factoryId,
    plan_code: "trial_14d",
    status: "trialing",
    trial_ends_at: new Date(Date.now() + 14 * 864e5).toISOString(),
  });
  if (se) {
    await d.from("profiles").delete().eq("id", newUserId);
    await d.from("factories").delete().eq("id", factoryId);
    await adm.auth.admin.deleteUser(newUserId);
    return { ok: false, error: se.message };
  }

  const { error: ue } = await d
    .from("factory_registration_requests")
    .update({
      status: "approved",
      processed_at: now,
      processed_by: params.platformAdminId,
    })
    .eq("id", params.requestId);
  if (ue) return { ok: false, error: ue.message };

  return { ok: true, factoryId };
}

export async function updateFactoryStatus(
  factoryId: string,
  status: Factory["status"],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { error } = await c
    .from("factories")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", factoryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateFactoryPackage(
  factoryId: string,
  packageStatus: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { error } = await c
    .from("factories")
    .update({
      package_status: packageStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", factoryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listUsersInFactory(
  factoryId: string,
): Promise<RbacUser[]> {
  const c = await db();
  if (!c) return [];
  const { data, error } = await c
    .from("profiles")
    .select("*")
    .eq("factory_id", factoryId)
    .neq("role", "platform_admin")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(mapProfileToRbacUser);
}

export async function listInvitationsInFactory(
  factoryId: string,
): Promise<Invitation[]> {
  const c = await db();
  if (!c) return [];
  const { data, error } = await c
    .from("factory_invitations")
    .select("*")
    .eq("factory_id", factoryId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).map(mapInvitation);
}

export async function createInvitation(params: {
  factoryId: string;
  invitedByUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Exclude<RoleKey, "PLATFORM_ADMIN">;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const email = params.email.trim().toLowerCase();
  const { data: dup } = await c
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (dup) return { ok: false, error: "Bu e-posta zaten kayıtlı." };
  const { data: dupInv } = await c
    .from("factory_invitations")
    .select("id")
    .eq("factory_id", params.factoryId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();
  if (dupInv) return { ok: false, error: "Bu e-posta için bekleyen davet var." };

  const { data, error } = await c
    .from("factory_invitations")
    .insert({
      factory_id: params.factoryId,
      email,
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      phone: params.phone?.trim() ?? null,
      role: roleKeyToDbRole(params.role),
      invited_by: params.invitedByUserId,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Davet eklenemedi." };
  return { ok: true, id: data.id as string };
}

export async function acceptInvitation(
  invitationId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const d = await db();
  const adm = await admin();
  if (!d) return { ok: false, error: "Supabase yapılandırılmamış." };
  if (!adm) {
    return {
      ok: false,
      error:
        "Davet kabulü için SUPABASE_SERVICE_ROLE_KEY (Auth Admin) gerekli.",
    };
  }
  const { data: inv, error: ie } = await d
    .from("factory_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("status", "pending")
    .maybeSingle();
  if (ie) return { ok: false, error: ie.message };
  if (!inv) return { ok: false, error: "Davet bulunamadı." };

  const row = inv as Record<string, unknown>;
  const email = row.email as string;
  const tempPassword = `${crypto.randomUUID().replaceAll("-", "")}Aa1!`;

  const { data: authData, error: authErr } = await adm.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: row.first_name,
      last_name: row.last_name,
    },
  });
  if (authErr || !authData.user) {
    return { ok: false, error: authErr?.message ?? "Kullanıcı oluşturulamadı." };
  }
  const uid = authData.user.id;

  const { error: pe } = await d.from("profiles").insert({
    id: uid,
    factory_id: row.factory_id as string,
    email,
    first_name: row.first_name as string,
    last_name: row.last_name as string,
    phone: (row.phone as string) ?? null,
    role: row.role as string,
    status: "active",
  });
  if (pe) {
    await adm.auth.admin.deleteUser(uid);
    return { ok: false, error: pe.message };
  }

  const { error: ue } = await d
    .from("factory_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);
  if (ue) return { ok: false, error: ue.message };

  return { ok: true, userId: uid };
}

export async function cancelInvitation(
  invitationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { error } = await c
    .from("factory_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateUserRoleInFactory(params: {
  actorFactoryId: string;
  targetUserId: string;
  newRole: Exclude<RoleKey, "PLATFORM_ADMIN">;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { data: target } = await c
    .from("profiles")
    .select("id, factory_id, role")
    .eq("id", params.targetUserId)
    .maybeSingle();
  if (!target || target.factory_id !== params.actorFactoryId) {
    return { ok: false, error: "Kullanıcı bulunamadı." };
  }
  if (target.role === "company_admin" && roleKeyToDbRole(params.newRole) !== "company_admin") {
    const { count } = await c
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("factory_id", params.actorFactoryId)
      .eq("role", "company_admin")
      .eq("status", "active");
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Son fabrika yöneticisinin rolü değiştirilemez." };
    }
  }
  const { error } = await c
    .from("profiles")
    .update({
      role: roleKeyToDbRole(params.newRole),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setUserActiveFlag(params: {
  actorFactoryId: string;
  targetUserId: string;
  active: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  if (!c) return { ok: false, error: "Supabase yapılandırılmamış." };
  const { data: target } = await c
    .from("profiles")
    .select("factory_id, role, status")
    .eq("id", params.targetUserId)
    .maybeSingle();
  if (!target || target.factory_id !== params.actorFactoryId) {
    return { ok: false, error: "Kullanıcı bulunamadı." };
  }
  if (target.role === "company_admin" && !params.active) {
    const { count } = await c
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("factory_id", params.actorFactoryId)
      .eq("role", "company_admin")
      .eq("status", "active");
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Son fabrika yöneticisi pasifleştirilemez." };
    }
  }
  const { error } = await c
    .from("profiles")
    .update({
      status: params.active ? "active" : "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getSubscriptionForFactory(
  factoryId: string,
): Promise<SubscriptionRecord | undefined> {
  const c = await db();
  if (!c) return undefined;
  const { data, error } = await c
    .from("factory_subscriptions")
    .select("*")
    .eq("factory_id", factoryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSubscription(data as Record<string, unknown>) : undefined;
}
