"use client";

import { Menu } from "lucide-react";
import * as React from "react";

import { PlatformSidebarNav } from "@/components/layout/platform-sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { brand } from "@/lib/constants/brand";

export function PlatformMobileNav() {
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
        className="flex w-[min(16rem,85vw)] max-w-[min(16rem,85vw)] flex-col border-violet-900 bg-violet-950 p-0 text-violet-50 [&>button]:text-violet-300 [&>button]:hover:text-white [&>button]:ring-offset-violet-950"
      >
        <SheetTitle className="sr-only">Platform menü</SheetTitle>
        <div className="border-b border-violet-900 px-4 py-3 pr-12">
          <p className="font-mono text-base font-semibold leading-tight text-white">
            {brand.name}
          </p>
          <p className="mt-1 text-xs text-violet-300">Platform Yöneticisi</p>
        </div>
        <PlatformSidebarNav onNavigate={() => setOpen(false)} />
        <Separator className="bg-violet-900" />
        <div className="p-3 text-[10px] text-violet-400">
          Excel aktarımları ve stok/UE listeleri salt okunur izlenir; düzenleme fabrika panelindedir.
        </div>
      </SheetContent>
    </Sheet>
  );
}
