"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  setFactoryPackageAction,
  setFactoryStatusAction,
} from "@/app/actions/platform-factories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FactoryAdminActions({ factoryId }: { factoryId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Erişim durumu</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await setFactoryStatusAction(factoryId, "active");
                if (!r.ok) globalThis.alert(r.error);
                router.refresh();
              });
            }}
          >
            Aktif et
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await setFactoryStatusAction(factoryId, "passive");
                if (!r.ok) globalThis.alert(r.error);
                router.refresh();
              });
            }}
          >
            Pasifleştir
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await setFactoryStatusAction(factoryId, "suspended");
                if (!r.ok) globalThis.alert(r.error);
                router.refresh();
              });
            }}
          >
            Askıya al
          </Button>
        </div>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const pkg = String(fd.get("packageStatus") ?? "");
          startTransition(async () => {
            const r = await setFactoryPackageAction(factoryId, pkg);
            if (!r.ok) globalThis.alert(r.error);
            router.refresh();
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="packageStatus">Paket / lisans etiketi</Label>
          <Input
            id="packageStatus"
            name="packageStatus"
            placeholder="trial, active, lapsed..."
            className="w-56"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Paketi güncelle
        </Button>
      </form>
    </div>
  );
}
