"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { brand, mainNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="text-base font-semibold font-mono leading-tight tracking-tight text-white">
          {brand.name}
        </p>
        <p className="mt-1 text-xs leading-snug text-slate-400">{brand.slogan}</p>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {mainNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/kokpit" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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
        </nav>
      </ScrollArea>
      <Separator className="bg-slate-800" />
      <div className="p-3 text-xs text-slate-500">
        {brand.slogan} · v1 · Supabase
      </div>
    </aside>
  );
}
