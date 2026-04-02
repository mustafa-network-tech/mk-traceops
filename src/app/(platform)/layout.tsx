import { redirect } from "next/navigation";

import { PlatformShell } from "@/components/layout/platform-shell";
import { loadActorSwitcherOptions } from "@/lib/rbac/actor-options";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlatformGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getRbacSession();
  if (!ctx?.user || ctx.user.status !== "active") {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/giris");
    }
    redirect("/yetkisiz");
  }
  if (!isPlatformAdmin(ctx.user)) {
    redirect("/kokpit");
  }

  return (
    <PlatformShell
      currentUserId={ctx.user.id}
      actors={await loadActorSwitcherOptions()}
    >
      {children}
    </PlatformShell>
  );
}
