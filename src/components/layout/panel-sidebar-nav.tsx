"use client";

import Link from "next/link";
import { UserCog } from "lucide-react";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { mainNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function PanelSidebarNav({
  allowedHrefs,
  onNavigate,
}: {
  allowedHrefs: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const allow = new Set(allowedHrefs);

  const navItems = mainNav.filter((item) => allow.has(item.href));
  const showUserMgmt = allow.has("/yonetim/kullanicilar");

  return (
    <ScrollArea className="flex-1 py-2">
      <nav className="flex flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/kokpit" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
        {showUserMgmt ? (
          <Link
            href="/yonetim/kullanicilar"
            onClick={() => onNavigate?.()}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              pathname.startsWith("/yonetim")
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-900 hover:text-white",
            )}
          >
            <UserCog className="h-4 w-4 shrink-0 opacity-80" />
            <span className="truncate">Kullanıcılar ve davetler</span>
          </Link>
        ) : null}
      </nav>
    </ScrollArea>
  );
}
