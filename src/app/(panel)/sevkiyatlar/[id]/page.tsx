import Link from "next/link";
import { notFound } from "next/navigation";

import { ShipmentStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getProduct,
  getProductStockByProductId,
  getShipment,
  getShipmentItems,
} from "@/lib/data/supabase-data";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function SevkiyatDetayPage({ params }: Props) {
  const { id } = await params;
  const sh = await getShipment(id);
  if (!sh) notFound();

  const items = await getShipmentItems(id);
  const products = await Promise.all(items.map((i) => getProduct(i.productId)));
  const stocks = await Promise.all(
    items.map((i) => getProductStockByProductId(i.productId)),
  );

  return (
    <div>
      <PageHeader
        title={sh.shipmentNumber}
        description="Sevkiyat kalemleri ve stok bağlantısı."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Sevkiyatlar", href: "/sevkiyatlar" },
          { label: sh.shipmentNumber },
        ]}
        actions={
          <Link
            href="/sevkiyatlar"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alıcı</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-semibold">{sh.recipientName}</div>
            <div>{sh.destination}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">İletişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>{sh.contactPhone ?? "—"}</div>
            <div className="truncate">{sh.contactEmail ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ShipmentStatusBadge status={sh.status} />
            <div className="text-xs text-slate-600">
              {formatDateTime(sh.shippedAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Kalemler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Stok ref.</TableHead>
                <TableHead className="text-right">Güncel mamul stok</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i, idx) => {
                const p = products[idx];
                const stock = stocks[idx];
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{p?.code}</div>
                      <div className="text-sm">{p?.name}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {i.quantity} {i.unit}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {i.stockMovementRef ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {stock?.currentStock ?? "—"} {p?.unit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea readOnly className="bg-slate-50" value={sh.notes ?? "—"} />
        </CardContent>
      </Card>
    </div>
  );
}
