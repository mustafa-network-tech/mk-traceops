import { redirect } from "next/navigation";

import { PlatformShell } from "@/components/layout/platform-shell";
import { loadActorSwitcherOptions } from "@/lib/rbac/actor-options";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function PlatformGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getRbacSession();
  if (!ctx?.user || ctx.user.status !== "active") {
    redirect("/giris");
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
