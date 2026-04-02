import { ActorSwitcher } from "@/components/rbac/actor-switcher";
import type { ActorOption } from "@/lib/rbac/types";
import { brand } from "@/lib/constants/brand";

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
      <PlatformSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono font-medium text-slate-800">{brand.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-violet-700 font-medium">Platform yönetimi</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">
              Fabrika paneli için üstteki oturumdan fabrika kullanıcısı seçin.
            </span>
          </div>
          {actors.length > 0 ? (
            <ActorSwitcher currentUserId={currentUserId} actors={actors} />
          ) : null}
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
