"use client";

import { useMemo, useState } from "react";

import { StockMovementTypeLabel } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
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
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AssemblyGroup, Location, Material, StockMovement } from "@/lib/types/models";

type Row = {
  movement: StockMovement;
  material?: Material;
  location?: Location;
  assembly?: AssemblyGroup;
};

export function StockMovementFilters({ rows }: { rows: Row[] }) {
  const [type, setType] = useState<string>("all");
  const [materialId, setMaterialId] = useState<string>("all");

  const materials = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => {
      if (r.material) m.set(r.material.id, `${r.material.code} — ${r.material.name}`);
    });
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (type !== "all" && r.movement.type !== type) return false;
      if (materialId !== "all" && r.movement.materialId !== materialId)
        return false;
      return true;
    });
  }, [rows, type, materialId]);

  return (
    <div>
      <PageHeader
        title="Stok hareketleri"
        description="Giriş, çıkış, üretimde kullanım, iade, fire ve manuel düzeltme. Üretim emri ve montaj grubu referansları ile izlenebilir."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Stok hareketleri" },
        ]}
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Hareket tipi</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
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
          <Label>Malzeme</Label>
          <Select value={materialId} onValueChange={setMaterialId}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {materials.map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end text-sm text-slate-600">
          {filtered.length} / {rows.length} kayıt
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Malzeme</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>UE / Montaj</TableHead>
              <TableHead>Not</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ movement: s, material, location, assembly }) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDateTime(s.occurredAt)}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-xs">{material?.code}</div>
                  <div className="text-sm">{material?.name}</div>
                </TableCell>
                <TableCell>
                  <StockMovementTypeLabel type={s.type} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(s.quantity, s.unit)}
                </TableCell>
                <TableCell className="text-sm">{location?.name ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {s.productionOrderId ? (
                    <div>UE: {s.productionOrderId}</div>
                  ) : null}
                  {assembly ? <div>Montaj: {assembly.code}</div> : null}
                  {!s.productionOrderId && !assembly ? "—" : null}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-slate-600">
                  {s.note ?? s.projectReference ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
