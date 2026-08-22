"use client";

import { Menu } from "lucide-react";
import * as React from "react";

import { PanelSidebarNav } from "@/components/layout/panel-sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { brand } from "@/lib/constants/brand";

export function PanelMobileNav({ allowedHrefs }: { allowedHrefs: string[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-slate-300 md:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(18rem,85vw)] max-w-[min(18rem,85vw)] flex-col border-slate-800 bg-slate-950 p-0 text-slate-100 [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:ring-offset-slate-950"
      >
        <SheetTitle className="sr-only">{brand.name} menü</SheetTitle>
        <div className="border-b border-slate-800 px-4 py-3 pr-12">
          <p className="font-mono text-base font-semibold leading-tight tracking-tight text-white">
            {brand.name}
          </p>
          <p className="mt-1 text-xs leading-snug text-slate-400">{brand.slogan}</p>
        </div>
        <PanelSidebarNav
          allowedHrefs={allowedHrefs}
          onNavigate={() => setOpen(false)}
        />
        <Separator className="bg-slate-800" />
        <div className="p-3 text-xs text-slate-500">
          {brand.slogan} · v1 · Cloudflare D1
        </div>
      </SheetContent>
    </Sheet>
  );
}
