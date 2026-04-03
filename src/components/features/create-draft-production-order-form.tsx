"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { createDraftProductionOrderAction } from "@/app/actions/production-create";
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
import { Textarea } from "@/components/ui/textarea";
import type { AssemblyGroup, Department, Product } from "@/lib/types/models";

function todayIsoDate() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type Props = {
  products: Product[];
  departments: Department[];
  assemblies: AssemblyGroup[];
};

export function CreateDraftProductionOrderForm({
  products,
  departments,
  assemblies,
}: Props) {
  const router = useRouter();
  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products],
  );

  const [orderNo, setOrderNo] = useState("");
  const [productId, setProductId] = useState(activeProducts[0]?.id ?? "");
  const [quantityPlanned, setQuantityPlanned] = useState("1");
  const [scheduledDate, setScheduledDate] = useState(todayIsoDate);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [assemblyGroupId, setAssemblyGroupId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setBusy(true);
    try {
      const res = await createDraftProductionOrderAction({
        orderNo,
        productId,
        quantityPlanned: Number(quantityPlanned.replace(",", ".")),
        scheduledDate,
        departmentId,
        assemblyGroupId:
          assemblyGroupId === "none" ? null : assemblyGroupId || null,
        notes: notes.trim() || null,
      });
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess("Taslak üretim emri oluşturuldu.");
      router.push(`/uretim-emirleri/${res.orderId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [
    assemblyGroupId,
    departmentId,
    notes,
    orderNo,
    productId,
    quantityPlanned,
    router,
    scheduledDate,
  ]);

  if (activeProducts.length === 0 || departments.length === 0) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">Yeni taslak emir</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          En az bir aktif ürün ve bir bölüm tanımlı olmalıdır.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Yeni taslak üretim emri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>
          Oluşturulan kayıt <strong>taslak</strong> olur; stok hareketi yoktur. Üretim ve malzeme
          çıkışı için önce detaydan <strong>Planlamaya al (onay)</strong> kullanın.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Emir no</Label>
            <Input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Örn. UE-2026-042"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Ürün</Label>
            <Select value={productId || undefined} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Planlanan miktar</Label>
            <Input
              inputMode="decimal"
              value={quantityPlanned}
              onChange={(e) => setQuantityPlanned(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plan tarihi</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bölüm</Label>
            <Select
              value={departmentId || undefined}
              onValueChange={setDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label>Montaj grubu (isteğe bağlı)</Label>
            <Select value={assemblyGroupId} onValueChange={setAssemblyGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {assemblies.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.code} — {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label>Not (isteğe bağlı)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[72px]"
            />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void submit()}>
          {busy ? "Oluşturuluyor…" : "Taslak emir oluştur"}
        </Button>
      </CardContent>
    </Card>
  );
}
