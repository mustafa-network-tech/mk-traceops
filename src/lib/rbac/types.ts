/** Sabit rol anahtarları — dinamik rol yok. */
export type RoleKey =
  | "PLATFORM_ADMIN"
  | "COMPANY_ADMIN"
  | "PRODUCTION_USER"
  | "WAREHOUSE_USER"
  | "SHIPMENT_USER"
  | "VIEWER";

/** Fabrika durumu. */
export type FactoryStatus = "pending" | "active" | "passive" | "suspended";

export type FactoryRequestStatus = "pending" | "approved" | "rejected";

export type InvitationStatus = "pending" | "accepted" | "cancelled";

export type RbacUserStatus = "active" | "inactive" | "pending_invite";

export interface Factory {
  id: string;
  factoryName: string;
  factorySlug: string;
  status: FactoryStatus;
  packageStatus: string;
  createdAt: string;
  approvedByPlatformAdminId?: string;
  approvedAt?: string;
  /** Parça BOM patlatma ve bağlantı döngü kontrolü (seviye üst sınırı). */
  bomExplosionMaxDepth: number;
}

export interface FactoryRequest {
  id: string;
  requestedFactoryName: string;
  requestedSlug: string;
  applicantEmail: string;
  applicantName: string;
  /** Kayıt formu ile gelen başvurular için auth.users.id */
  applicantUserId?: string | null;
  applicantFirstName?: string | null;
  applicantLastName?: string | null;
  status: FactoryRequestStatus;
  createdAt: string;
}

export interface RbacUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleKey;
  /** PLATFORM_ADMIN için null. */
  factoryId: string | null;
  status: RbacUserStatus;
  createdAt: string;
}

export interface Invitation {
  id: string;
  factoryId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Exclude<RoleKey, "PLATFORM_ADMIN">;
  status: InvitationStatus;
  invitedByUserId: string;
  createdAt: string;
  /** İleride Supabase magic link / token ile doldurulacak. */
  token: string;
}

export interface SubscriptionRecord {
  id: string;
  factoryId: string;
  planCode: string;
  status: string;
  trialEndsAt?: string;
}

export interface RbacSessionContext {
  user: RbacUser;
  factory: Factory | null;
  permissions: Set<string>;
}

/** Geliştirme çerezi ile oturum seçici (RBAC_ALLOW_PROFILE_COOKIE). */
export type ActorOption = {
  id: string;
  label: string;
  role: RoleKey;
};
