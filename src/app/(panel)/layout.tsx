import { redirect } from "next/navigation";

import { PanelShell } from "@/components/layout/panel-shell";
import {
  canAccessFactoryPanel,
  isPlatformAdmin,
} from "@/lib/rbac/helpers";
import { loadActorSwitcherOptions } from "@/lib/rbac/actor-options";
import { allowedPanelHrefs } from "@/lib/rbac/navigation-filter";
import { getRbacSession } from "@/lib/rbac/session-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getRbacSession();
  if (!ctx?.user) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/giris");
    }
    redirect("/yetkisiz");
  }
  if (isPlatformAdmin(ctx.user)) {
    redirect("/platform");
  }
  if (!canAccessFactoryPanel(ctx.user)) {
    redirect("/yetkisiz");
  }
  const f = ctx.factory;
  if (
    f &&
    (f.status === "suspended" ||
      f.status === "passive" ||
      f.status === "pending")
  ) {
    redirect("/hesap-askida");
  }

  const allowed = allowedPanelHrefs(ctx);
  const actors = await loadActorSwitcherOptions();

  return (
    <PanelShell
      allowedHrefs={allowed}
      currentUserId={ctx.user.id}
      actors={actors}
      factoryLabel={f?.factoryName ?? null}
    >
      {children}
    </PanelShell>
  );
}
