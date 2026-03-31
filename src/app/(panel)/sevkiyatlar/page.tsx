import Link from "next/link";

import { ShipmentStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listProducts,
  listShipmentItems,
  listShipments,
} from "@/lib/data/supabase-data";
import { formatDateTime } from "@/lib/format";

export default async function SevkiyatlarPage() {
  const [list, allItems, products] = await Promise.all([
    listShipments(),
    listShipmentItems(),
    listProducts(),
  ]);

  const prodById = new Map(products.map((p) => [p.id, p]));
  const itemsByShipment = new Map<string, typeof allItems>();
  for (const i of allItems) {
    const cur = itemsByShipment.get(i.shipmentId) ?? [];
    cur.push(i);
    itemsByShipment.set(i.shipmentId, cur);
  }

  return (
    <div>
      <PageHeader
        title="Sevkiyatlar"
        description="Mamul çıkışları: alıcı, varış, durum ve kalem detayları. Stok düşüm referansı kalem bazında tutulur."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Sevkiyatlar" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sevkiyat no</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Alıcı</TableHead>
              <TableHead>Varış</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Özet kalemler</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((sh) => {
              const items = itemsByShipment.get(sh.id) ?? [];
              const summary = items
                .map((i) => {
                  const p = prodById.get(i.productId);
                  return `${p?.code ?? "?"} × ${i.quantity}`;
                })
                .join(", ");
              return (
                <TableRow key={sh.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {sh.shipmentNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(sh.shippedAt)}
                  </TableCell>
                  <TableCell className="font-medium">{sh.recipientName}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {sh.destination}
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={sh.status} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-600">
                    {summary || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sevkiyatlar/${sh.id}`}>Detay</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
