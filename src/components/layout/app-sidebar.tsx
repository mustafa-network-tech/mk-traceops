"use client";

import { Separator } from "@/components/ui/separator";
import { brand } from "@/lib/constants/brand";
import { PanelSidebarNav } from "@/components/layout/panel-sidebar-nav";

export function AppSidebar({ allowedHrefs }: { allowedHrefs: string[] }) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="text-base font-semibold font-mono leading-tight tracking-tight text-white">
          {brand.name}
        </p>
        <p className="mt-1 text-xs leading-snug text-slate-400">{brand.slogan}</p>
      </div>
      <PanelSidebarNav allowedHrefs={allowedHrefs} />
      <Separator className="bg-slate-800" />
      <div className="p-3 text-xs text-slate-500">
        {brand.slogan} · v1 · Cloudflare D1
      </div>
    </aside>
  );
}
