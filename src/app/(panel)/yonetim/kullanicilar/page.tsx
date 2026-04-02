import { PageHeader } from "@/components/layout/page-header";
import { CompanyInviteForm } from "@/components/rbac/company-invite-form";
import { CompanyUsersPanel } from "@/components/rbac/company-users-panel";
import {
  listInvitationsInFactory,
  listUsersInFactory,
} from "@/lib/data/rbac-supabase";
import { getRbacSession } from "@/lib/rbac/session-server";
import { isCompanyAdmin } from "@/lib/rbac/helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function YonetimKullanicilarPage() {
  const ctx = await getRbacSession();
  if (!ctx?.user.factoryId || !isCompanyAdmin(ctx.user)) {
    redirect("/yetkisiz");
  }
  const factoryId = ctx.user.factoryId;
  const [users, invitations] = await Promise.all([
    listUsersInFactory(factoryId),
    listInvitationsInFactory(factoryId),
  ]);

  return (
    <div>
      <PageHeader
        title="Kullanıcılar ve davetler"
        description="Fabrika içi roller, davetler ve hesap durumu. (Supabase Auth ile e-posta daveti ileride bağlanacak.)"
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Kullanıcı yönetimi" },
        ]}
      />

      <div className="mb-8">
        <CompanyInviteForm />
      </div>

      <CompanyUsersPanel
        users={users}
        invitations={invitations}
        currentUserId={ctx.user.id}
      />
    </div>
  );
}
