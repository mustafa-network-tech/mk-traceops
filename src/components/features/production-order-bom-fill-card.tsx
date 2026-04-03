"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { fillProductionOrderLinesFromBomAction } from "@/app/actions/production-order-bom-fill";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { ProductionOrderBomPreviewRow } from "@/lib/data/supabase-data";

type Preview =
  | { ok: true; rows: ProductionOrderBomPreviewRow[] }
  | { ok: false; message: string };

type Props = {
  orderId: string;
  preview: Preview;
  hasExistingLines: boolean;
  canFill: boolean;
  /** canFill false iken kısa gerekçe */
  fillBlockedHint?: string;
};

export function ProductionOrderBomFillCard({
  orderId,
  preview,
  hasExistingLines,
  canFill,
  fillBlockedHint,
}: Props) {
  const router = useRouter();
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runFill() {
    startTransition(async () => {
      const res = await fillProductionOrderLinesFromBomAction({
        orderId,
        replaceExisting,
      });
      if (!res.ok) {
        toastActionError(res.error);
        return;
      }
      toastActionSuccess(
        `${res.lineCount} satır yazıldı${res.replaced ? " (öncekiler silindi)." : "."}`,
      );
      router.refresh();
    });
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>BOM önizleme ve satır doldurma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Aşağıdaki tablo, mamulün eşleşen parçası için{" "}
          <strong>planlanan miktar</strong> üzerinden patlatılmış malzeme ihtiyacını gösterir. «BOM’dan
          doldur» bu değerleri UE malzeme satırlarına yazar; üretim çıkışı bu satırlara göre
          ölçeklenir.
        </p>

        {!preview.ok ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {preview.message}
          </p>
        ) : (
          <div className="rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Malzeme</TableHead>
                  <TableHead className="text-right">Plan ihtiyaç</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((r) => (
                  <TableRow key={r.materialId}>
                    <TableCell>
                      <div className="font-mono text-xs">{r.code}</div>
                      <div className="text-sm">{r.name}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatNumber(r.quantity, r.unit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {canFill && preview.ok ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {hasExistingLines ? (
              <div className="flex items-center gap-2">
                <input
                  id="replace-bom-lines"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={replaceExisting}
                  disabled={isPending}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                <Label htmlFor="replace-bom-lines" className="text-sm font-normal">
                  Mevcut satırların üzerine yaz (silinip yeniden oluşturulur)
                </Label>
              </div>
            ) : (
              <span className="text-sm text-slate-500">UE’de henüz malzeme satırı yok.</span>
            )}
            <Button
              type="button"
              disabled={
                isPending ||
                (hasExistingLines && !replaceExisting) ||
                !preview.ok
              }
              onClick={runFill}
            >
              {isPending ? "Yazılıyor…" : "BOM’dan satırları doldur"}
            </Button>
          </div>
        ) : null}

        {!canFill ? (
          <p className="text-sm text-slate-500">
            {fillBlockedHint ??
              "Satır doldurma için emir güncelleme yetkisi gerekir veya emir bu işleme kapalı."}
          </p>
        ) : null}

        {hasExistingLines && canFill && preview.ok && !replaceExisting ? (
          <p className="text-xs text-slate-500">
            Zaten satır varken yazmak için yukarıdaki kutuyu işaretleyin.
          </p>
        ) : null}

      </CardContent>
    </Card>
  );
}
