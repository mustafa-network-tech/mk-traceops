"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { isPathAllowedForPanel } from "@/lib/rbac/navigation-filter";

type Props = {
  allowedHrefs: string[];
  children: React.ReactNode;
};

export function PanelRouteGuard({ allowedHrefs, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/yetkisiz" || pathname === "/hesap-askida") return;
    if (!isPathAllowedForPanel(pathname, allowedHrefs)) {
      router.replace("/yetkisiz");
    }
  }, [pathname, allowedHrefs, router]);

  return <>{children}</>;
}
