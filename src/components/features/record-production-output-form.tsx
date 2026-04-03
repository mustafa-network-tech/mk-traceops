"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { recordProductionOutputAction } from "@/app/actions/production-output";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Location } from "@/lib/types/models";

type Props = {
  orderId: string;
  orderNo: string;
  maxGoodQty: number;
  productUnit: string;
  locations: Location[];
};

export function RecordProductionOutputForm({
  orderId,
  orderNo,
  maxGoodQty,
  productUnit,
  locations,
}: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(String(Math.min(1, maxGoodQty)));
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    const q = Number(qty.replace(",", "."));
    if (!Number.isFinite(q) || q <= 0) {
      toastActionError("Geçerli bir miktar girin.");
      return;
    }
    if (q > maxGoodQty) {
      toastActionError(
        `En fazla ${maxGoodQty} ${productUnit} girebilirsiniz (plan kalanı).`,
      );
      return;
    }
    if (!locationId) {
      toastActionError("Lokasyon seçin.");
      return;
    }
    setBusy(true);
    try {
      const res = await recordProductionOutputAction({
        orderId,
        goodQty: q,
        locationId,
      });
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess("Üretim çıkışı kaydedildi.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [locationId, maxGoodQty, orderId, productUnit, qty, router]);

  if (locations.length === 0) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">Üretim çıkışı</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          Mamul stoğu için en az bir lokasyon tanımlı olmalıdır.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Üretim çıkışı (kapalı döngü)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>
          Bu emir <strong>onaylı</strong> ve planlı/üretimde. <strong>{orderNo}</strong> için bu
          seferde üretilen mamul miktarını girin. Sistem; plan oranına göre malzeme stoğunu düşer,{" "}
          <strong>üretimde kullanım</strong> stok hareketi yazar ve seçilen lokasyonda{" "}
          <strong>mamul stoğunu</strong> artırır. Plan tamamlanınca emir durumu{" "}
          <strong>tamamlandı</strong> olur.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Mamul miktarı ({productUnit})</Label>
            <Input
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <p className="text-xs text-slate-500">Kalan plan: {maxGoodQty} {productUnit}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Mamul lokasyonu</Label>
            <Select value={locationId || undefined} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.code} — {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Kaydediliyor…" : "Çıkışı kaydet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
