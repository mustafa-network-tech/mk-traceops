"use client";

import Link from "next/link";
import {
  Activity,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Waypoints,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const items = [
  { title: "Platform özeti", href: "/platform", icon: LayoutDashboard },
  {
    title: "Fabrika akışı & izleme",
    href: "/platform/fabrika-akisi",
    icon: Waypoints,
  },
  { title: "Onay bekleyen fabrikalar", href: "/platform/fabrika-talepleri", icon: ClipboardList },
  { title: "Fabrikalar", href: "/platform/fabrikalar", icon: Building2 },
  { title: "Excel aktarımları", href: "/platform/excel-aktarimlar", icon: FileSpreadsheet },
  { title: "Stok & üretim hareketleri", href: "/platform/fabrika-hareketleri", icon: Activity },
];

export function PlatformSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ScrollArea className="flex-1 py-2">
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/platform" &&
              pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
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
  );
}
