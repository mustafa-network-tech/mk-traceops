import Link from "next/link";

import { MaterialTypeBadge } from "@/components/domain/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { Material } from "@/lib/types/models";

type Row = {
  material: Material;
  categoryName: string;
  supplierCount: number;
  critical: boolean;
};

export function MaterialTable({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kod</TableHead>
            <TableHead>Ad</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Birim</TableHead>
            <TableHead className="text-right">Min. stok</TableHead>
            <TableHead className="text-right">Mevcut</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Tedarikçi</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ material: m, categoryName, supplierCount, critical }) => (
            <TableRow key={m.id}>
              <TableCell className="font-mono text-xs font-medium">{m.code}</TableCell>
              <TableCell>
                <div className="text-sm font-medium">{m.name}</div>
                {m.note ? (
                  <div className="text-xs text-slate-500 line-clamp-1">{m.note}</div>
                ) : null}
              </TableCell>
              <TableCell>
                <MaterialTypeBadge type={m.type} />
              </TableCell>
              <TableCell className="text-sm">{categoryName}</TableCell>
              <TableCell className="text-xs">{m.unit}</TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatNumber(m.minStock)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    critical ? "font-semibold text-red-700 tabular-nums" : "tabular-nums"
                  }
                >
                  {formatNumber(m.currentStock)}
                </span>
                {critical ? (
                  <Badge className="ml-2" variant="danger">
                    Kritik
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant={m.active ? "success" : "muted"}>
                  {m.active ? "Aktif" : "Pasif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{supplierCount}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/malzeme-tedarikci?malzeme=${m.id}`}>İlişkiler</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
