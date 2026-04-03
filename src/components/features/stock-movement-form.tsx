"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { createStockMovementAction } from "@/app/actions/stock-movements";
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
import type {
  AssemblyGroup,
  Location,
  Material,
  ProductionOrder,
  StockMovementType,
  Supplier,
} from "@/lib/types/models";

function localDateTimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = {
  materials: Material[];
  locations: Location[];
  suppliers: Supplier[];
  productionOrders: ProductionOrder[];
  assemblies: AssemblyGroup[];
};

export function StockMovementForm({
  materials,
  locations,
  suppliers,
  productionOrders,
  assemblies,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [materialId, setMaterialId] = useState<string>("");
  const [type, setType] = useState<StockMovementType>("giriş");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState(() => localDateTimeValue(new Date()));
  const [locationId, setLocationId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [productionOrderId, setProductionOrderId] = useState<string>("");
  const [assemblyGroupId, setAssemblyGroupId] = useState<string>("");
  const [projectReference, setProjectReference] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const matById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const onMaterialChange = useCallback(
    (id: string) => {
      setMaterialId(id);
      const m = matById.get(id);
      if (m) setUnit(m.unit);
    },
    [matById],
  );

  const submit = useCallback(async () => {
    if (!materialId) {
      toastActionError("Malzeme seçin.");
      return;
    }
    if (!locationId) {
      toastActionError("Lokasyon seçin.");
      return;
    }
    const q = Number(quantity.replace(",", "."));
    if (!Number.isFinite(q)) {
      toastActionError("Geçerli bir miktar girin.");
      return;
    }

    setBusy(true);
    try {
      const result = await createStockMovementAction({
        materialId,
        type,
        quantity: q,
        unit: unit.trim() || undefined,
        occurredAt,
        locationId,
        supplierId: supplierId || null,
        productionOrderId: productionOrderId || null,
        assemblyGroupId: assemblyGroupId || null,
        projectReference: projectReference.trim() || null,
        note: note.trim() || null,
      });
      if (!result.ok) {
        toastActionError(result.error);
        return;
      }
      toastActionSuccess("Stok hareketi kaydedildi.");
      setQuantity("");
      setNote("");
      setProjectReference("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [
    assemblyGroupId,
    locationId,
    materialId,
    note,
    occurredAt,
    productionOrderId,
    projectReference,
    quantity,
    router,
    supplierId,
    type,
    unit,
  ]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Yeni stok hareketi</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Malzeme</Label>
          <Select value={materialId || undefined} onValueChange={onMaterialChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Hareket tipi</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as StockMovementType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="giriş">Giriş</SelectItem>
              <SelectItem value="çıkış">Çıkış</SelectItem>
              <SelectItem value="üretimde_kullanım">Üretimde kullanım</SelectItem>
              <SelectItem value="iade">İade</SelectItem>
              <SelectItem value="fire">Fire</SelectItem>
              <SelectItem value="manuel_düzeltme">Manuel düzeltme</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Miktar</Label>
          <Input
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={type === "manuel_düzeltme" ? "Örn. 10 veya -5" : "Pozitif"}
          />
          {type === "manuel_düzeltme" ? (
            <p className="text-xs text-slate-500">
              Artış için pozitif, azalış için negatif değer girin.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Birim</Label>
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Malzemeden veya elle"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tarih / saat</Label>
          <Input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Lokasyon</Label>
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
        <div className="space-y-1.5">
          <Label>Tedarikçi (isteğe bağlı)</Label>
          <Select
            value={supplierId || "none"}
            onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {productionOrders.length > 0 ? (
          <div className="space-y-1.5">
            <Label>Üretim emri (isteğe bağlı)</Label>
            <Select
              value={productionOrderId || "none"}
              onValueChange={(v) => setProductionOrderId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {productionOrders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.orderNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {assemblies.length > 0 ? (
          <div className="space-y-1.5">
            <Label>Montaj grubu (isteğe bağlı)</Label>
            <Select
              value={assemblyGroupId || "none"}
              onValueChange={(v) => setAssemblyGroupId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {assemblies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Proje referansı (isteğe bağlı)</Label>
          <Input
            value={projectReference}
            onChange={(e) => setProjectReference(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Not (isteğe bağlı)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Kaydediliyor…" : "Hareketi kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
