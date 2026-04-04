"use client";

import { Separator } from "@/components/ui/separator";
import { brand } from "@/lib/constants/brand";

import { PlatformSidebarNav } from "./platform-sidebar-nav";

export function PlatformSidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-violet-950 bg-violet-950 text-violet-50">
      <div className="border-b border-violet-900 px-4 py-3">
        <p className="text-base font-semibold font-mono leading-tight text-white">
          {brand.name}
        </p>
        <p className="mt-1 text-xs text-violet-300">Platform Yöneticisi</p>
      </div>
      <PlatformSidebarNav />
      <Separator className="bg-violet-900" />
      <div className="p-3 text-[10px] text-violet-400">
        Excel aktarımları ve stok/UE listeleri salt okunur izlenir; düzenleme fabrika panelindedir.
      </div>
    </aside>
  );
}
