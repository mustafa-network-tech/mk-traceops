"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setRbacSessionUserAction } from "@/app/actions/rbac-session";
import { toastActionError } from "@/lib/client/action-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActorOption, RoleKey } from "@/lib/rbac/types";

const ROLE_LABELS: Record<RoleKey, string> = {
  PLATFORM_ADMIN: "Platform Yöneticisi",
  COMPANY_ADMIN: "Fabrika Yöneticisi",
  PRODUCTION_USER: "Üretim",
  WAREHOUSE_USER: "Depo",
  SHIPMENT_USER: "Sevkiyat",
  VIEWER: "Salt okunur",
};

export function ActorSwitcher({
  currentUserId,
  actors,
}: {
  currentUserId: string;
  actors: ActorOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <span className="hidden sm:inline whitespace-nowrap">Oturum (geliştirme)</span>
      <Select
        value={currentUserId}
        disabled={pending}
        onValueChange={(id) => {
          startTransition(async () => {
            const r = await setRbacSessionUserAction(id);
            if (!r.ok) {
              toastActionError(r.error);
              return;
            }
            const actor = actors.find((a) => a.id === id);
            if (actor?.role === "PLATFORM_ADMIN") {
              router.push("/platform");
            } else {
              router.push("/kokpit");
            }
            router.refresh();
          });
        }}
      >
        <SelectTrigger className="h-8 w-[min(100vw-8rem,220px)] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {actors.map((a) => (
            <SelectItem key={a.id} value={a.id} className="text-xs">
              {a.label} · {ROLE_LABELS[a.role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
