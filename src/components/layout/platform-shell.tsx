import Link from "next/link";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { ActorSwitcher } from "@/components/rbac/actor-switcher";
import type { ActorOption } from "@/lib/rbac/types";
import { brand } from "@/lib/constants/brand";

import { PlatformMobileNav } from "./platform-mobile-nav";
import { PlatformSidebar } from "./platform-sidebar";

export function PlatformShell({
  children,
  currentUserId,
  actors,
}: {
  children: React.ReactNode;
  currentUserId: string;
  actors: ActorOption[];
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="hidden md:flex md:h-screen md:shrink-0 md:sticky md:top-0 md:flex-col">
        <PlatformSidebar />
      </div>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <PlatformMobileNav />
            <span className="font-mono font-medium text-slate-800">{brand.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-violet-700 font-medium">Platform yönetimi</span>
            <span className="text-slate-300">|</span>
            <Link
              href="/tanitim"
              className="text-xs text-slate-600 underline-offset-2 hover:underline"
            >
              Ana sayfa
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">
              Fabrika paneli için üstteki oturumdan fabrika kullanıcısı seçin.
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actors.length > 0 ? (
              <ActorSwitcher currentUserId={currentUserId} actors={actors} />
            ) : null}
            <SignOutForm />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
