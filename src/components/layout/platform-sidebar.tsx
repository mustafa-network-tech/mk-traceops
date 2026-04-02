"use client";

import Link from "next/link";
import { Building2, ClipboardList, LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { brand } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

const items = [
  { title: "Platform özeti", href: "/platform", icon: LayoutDashboard },
  { title: "Onay bekleyen fabrikalar", href: "/platform/fabrika-talepleri", icon: ClipboardList },
  { title: "Fabrikalar", href: "/platform/fabrikalar", icon: Building2 },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-violet-950 bg-violet-950 text-violet-50">
      <div className="border-b border-violet-900 px-4 py-3">
        <p className="text-base font-semibold font-mono leading-tight text-white">
          {brand.name}
        </p>
        <p className="mt-1 text-xs text-violet-300">Platform Yöneticisi</p>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/platform" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-violet-800 text-white"
                    : "text-violet-200 hover:bg-violet-900 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-violet-900" />
      <div className="p-3 text-[10px] text-violet-400">
        Operasyonel fabrika verilerine erişim yoktur.
      </div>
    </aside>
  );
}
