"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { inviteFactoryUserAction } from "@/app/actions/company-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoleKey } from "@/lib/rbac/types";

const INVITE_ROLES: Exclude<RoleKey, "PLATFORM_ADMIN">[] = [
  "COMPANY_ADMIN",
  "PRODUCTION_USER",
  "WAREHOUSE_USER",
  "SHIPMENT_USER",
  "VIEWER",
];

const ROLE_TR: Record<Exclude<RoleKey, "PLATFORM_ADMIN">, string> = {
  COMPANY_ADMIN: "Fabrika yöneticisi",
  PRODUCTION_USER: "Üretim kullanıcısı",
  WAREHOUSE_USER: "Depo kullanıcısı",
  SHIPMENT_USER: "Sevkiyat kullanıcısı",
  VIEWER: "Salt okunur",
};

export function CompanyInviteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Yeni davet</h3>
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const role = fd.get("role") as Exclude<RoleKey, "PLATFORM_ADMIN">;
          startTransition(async () => {
            const r = await inviteFactoryUserAction({
              email: String(fd.get("email") ?? ""),
              firstName: String(fd.get("firstName") ?? ""),
              lastName: String(fd.get("lastName") ?? ""),
              phone: String(fd.get("phone") ?? "") || undefined,
              role,
            });
            if (!r.ok) {
              globalThis.alert(r.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="inv-email">E-posta</Label>
          <Input id="inv-email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-fn">Ad</Label>
          <Input id="inv-fn" name="firstName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-ln">Soyad</Label>
          <Input id="inv-ln" name="lastName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-phone">Telefon</Label>
          <Input id="inv-phone" name="phone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-role">Rol</Label>
          <select
            id="inv-role"
            name="role"
            required
            defaultValue="VIEWER"
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {INVITE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_TR[role]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Gönderiliyor…" : "Davet oluştur"}
          </Button>
        </div>
      </form>
    </div>
  );
}
