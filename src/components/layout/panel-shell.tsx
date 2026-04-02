import Link from "next/link";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PanelMobileNav } from "@/components/layout/panel-mobile-nav";
import { ActorSwitcher } from "@/components/rbac/actor-switcher";
import type { ActorOption } from "@/lib/rbac/types";
import { PanelRouteGuard } from "@/components/rbac/panel-route-guard";
import { brand } from "@/lib/constants/brand";

export function PanelShell({
  children,
  allowedHrefs,
  currentUserId,
  actors,
  factoryLabel,
}: {
  children: React.ReactNode;
  allowedHrefs: string[];
  currentUserId: string;
  actors: ActorOption[];
  factoryLabel?: string | null;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="hidden md:flex md:h-screen md:shrink-0 md:sticky md:top-0 md:flex-col">
        <AppSidebar allowedHrefs={allowedHrefs} />
      </div>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <PanelMobileNav allowedHrefs={allowedHrefs} />
            <span className="font-mono font-medium text-slate-800">{brand.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700">{brand.slogan}</span>
            {factoryLabel ? (
              <>
                <span className="text-slate-300">|</span>
                <span className="truncate text-xs font-medium text-slate-800">
                  {factoryLabel}
                </span>
              </>
            ) : null}
            <span className="text-slate-300">|</span>
            <Link
              href="/tanitim"
              className="text-xs text-slate-600 underline-offset-2 hover:underline"
            >
              Ana sayfa
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/platform"
              className="text-xs text-violet-700 underline-offset-2 hover:underline"
            >
              Platform yönetimi
            </Link>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actors.length > 0 ? (
              <ActorSwitcher currentUserId={currentUserId} actors={actors} />
            ) : null}
            <SignOutForm />
          </div>
        </header>
        <PanelRouteGuard allowedHrefs={allowedHrefs}>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </PanelRouteGuard>
      </div>
    </div>
  );
}
