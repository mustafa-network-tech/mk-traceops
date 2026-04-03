"use client";

import { useMemo, useState, useTransition } from "react";

import {
  addPartChildLinkAction,
  deletePartChildLinkAction,
} from "@/app/actions/part-child-links";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Part, PartChildPart } from "@/lib/types/models";

type Props = {
  parts: Part[];
  links: PartChildPart[];
  canEdit: boolean;
};

export function PartChildLinksPanel({ parts, links, canEdit }: Props) {
  const [parentId, setParentId] = useState<string>("");
  const [childId, setChildId] = useState<string>("");
  const [qty, setQty] = useState<string>("1");
  const [isPending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);

  const sortedParts = useMemo(
    () => [...parts].sort((a, b) => a.partCode.localeCompare(b.partCode, "tr")),
    [parts],
  );

  function label(p: Part) {
    return `${p.partCode} — ${p.description || "—"}`;
  }

  function submitAdd() {
    const q = Number(qty.replace(",", "."));
    startTransition(async () => {
      const res = await addPartChildLinkAction({
        parentPartId: parentId,
        childPartId: childId,
        quantityPerParent: q,
      });
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess("Bağlantı eklendi.");
      setChildId("");
      setQty("1");
    });
  }

  function removeLink(id: string) {
    startTransition(async () => {
      const res = await deletePartChildLinkAction(id);
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess("Bağlantı silindi.");
    });
  }

  const sortedLinks = useMemo(
    () =>
      [...links].sort((a, b) => {
        const pa = byId.get(a.parentPartId)?.partCode ?? "";
        const pb = byId.get(b.parentPartId)?.partCode ?? "";
        const c = pa.localeCompare(pb, "tr");
        if (c !== 0) return c;
        const ca = byId.get(a.childPartId)?.partCode ?? "";
        const cb = byId.get(b.childPartId)?.partCode ?? "";
        return ca.localeCompare(cb, "tr");
      }),
    [links, byId],
  );

  return (
    <div className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Alt parça / montaj hiyerarşisi
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Üst parça başına kaç alt parça girdiğini tanımlayın. MRP ve üretim çıkışı (UE satırı
          yokken) bu ağacı patlatarak tüm kademelerdeki malzeme ihtiyaçlarını toplar.
        </p>
      </div>

      {canEdit && parts.length > 0 ? (
        <div className="grid gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Üst parça</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {sortedParts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {label(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Alt parça</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {sortedParts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {label(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty-child">Üst başına miktar</Label>
            <Input
              id="qty-child"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              disabled={isPending || !parentId || !childId}
              onClick={submitAdd}
            >
              Bağlantı ekle
            </Button>
          </div>
        </div>
      ) : null}

      {!canEdit ? (
        <p className="text-sm text-slate-500">
          Bağlantı eklemek veya silmek için «Parça / malzeme» güncelleme yetkisi gerekir.
        </p>
      ) : null}

      <div className="rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Üst parça</TableHead>
              <TableHead>Alt parça</TableHead>
              <TableHead className="text-right">Üst başına</TableHead>
              <TableHead>Birim</TableHead>
              {canEdit ? <TableHead className="w-24" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLinks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 5 : 4}
                  className="text-sm text-slate-500"
                >
                  Henüz alt parça bağlantısı yok. Tek seviye BOM yalnızca her parçanın kendi
                  malzeme satırlarıyla çalışır; çok seviye için burada ağaç kurun.
                </TableCell>
              </TableRow>
            ) : (
              sortedLinks.map((l) => {
                const pu = byId.get(l.parentPartId);
                const cu = byId.get(l.childPartId);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">
                      {pu ? pu.partCode : l.parentPartId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {cu ? cu.partCode : l.childPartId}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.quantityPerParent}
                    </TableCell>
                    <TableCell className="text-xs">{l.unit}</TableCell>
                    {canEdit ? (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:text-red-800"
                          disabled={isPending}
                          onClick={() => removeLink(l.id)}
                        >
                          Sil
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
