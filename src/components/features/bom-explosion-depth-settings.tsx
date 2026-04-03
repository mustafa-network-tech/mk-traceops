"use client";

import { useState, useTransition } from "react";

import { updateBomExplosionDepthAction } from "@/app/actions/factory-bom-settings";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import {
  BOM_EXPLOSION_DEPTH_MAX,
  BOM_EXPLOSION_DEPTH_MIN,
} from "@/lib/constants/bom-explosion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  initialDepth: number;
  factoryName?: string;
  canEdit: boolean;
};

export function BomExplosionDepthSettings({
  initialDepth,
  factoryName,
  canEdit,
}: Props) {
  const [value, setValue] = useState(String(initialDepth));
  const [isPending, startTransition] = useTransition();

  function save() {
    const n = Number(value.replace(",", "."));
    startTransition(async () => {
      const res = await updateBomExplosionDepthAction(n);
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess(
        "Kaydedildi. Patlatma ve döngü kontrolü yeni değeri kullanır.",
      );
    });
  }

  return (
    <div className="space-y-4">
      {factoryName ? (
        <p className="text-sm text-slate-600">
          Fabrika: <span className="font-medium text-slate-800">{factoryName}</span>
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        <code className="rounded bg-slate-100 px-1 text-xs">explode_part_bom</code> ve{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">part_child_parts</code> döngü
        kontrolü, kök/üst parçanın fabrikasındaki bu üst sınırı kullanır (1–128 seviye).
      </p>
      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="bom-depth">BOM patlatma derinlik üst sınırı</Label>
        <Input
          id="bom-depth"
          type="number"
          min={BOM_EXPLOSION_DEPTH_MIN}
          max={BOM_EXPLOSION_DEPTH_MAX}
          value={value}
          disabled={!canEdit || isPending}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {canEdit ? (
        <Button type="button" disabled={isPending} onClick={save}>
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      ) : (
        <p className="text-sm text-slate-500">
          Değiştirmek için şirket ayarları güncelleme yetkisi gerekir.
        </p>
      )}
    </div>
  );
}
