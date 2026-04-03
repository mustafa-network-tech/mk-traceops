import Link from "next/link";

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
import { formatDate, formatDateTime } from "@/lib/format";
import {
  listLocations,
  listProductStockItems,
  listProductionOrders,
  listProducts,
  listShipmentItems,
  listShipments,
} from "@/lib/data/supabase-data";
import { hasPermission } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function UrunStoguPage() {
  const ctx = await getRbacSession();
  const canReadProductionOrders = hasPermission(ctx, "production_orders", "read");

  const [items, products, locations, orders, shipItems, shipments] =
    await Promise.all([
      listProductStockItems(),
      listProducts(),
      listLocations(),
      canReadProductionOrders ? listProductionOrders() : Promise.resolve([]),
      listShipmentItems(),
      listShipments(),
    ]);

  const prodById = new Map(products.map((p) => [p.id, p]));
  const locById = new Map(locations.map((l) => [l.id, l]));
  const shipById = new Map(shipments.map((s) => [s.id, s]));

  return (
    <div>
      <PageHeader
        title="Ürün stoğu"
        description="Mamul stokları malzeme stoğundan ayrı izlenir. Son üretim tarihi, yakın üretim emirleri ve sevkiyat hareketleri özeti."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ürün stoğu" },
        ]}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/sevkiyatlar">Sevkiyatlara git</Link>
          </Button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead className="text-right">Mevcut stok</TableHead>
              <TableHead>Son üretim</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>Son üretim emirleri</TableHead>
              <TableHead>Son sevkiyat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((psi) => {
              const p = prodById.get(psi.productId);
              const loc = locById.get(psi.locationId);
              const recentPo = orders
                .filter((o) => o.productId === psi.productId)
                .sort((a, b) => (a.scheduledDate < b.scheduledDate ? 1 : -1))
                .slice(0, 2);
              const relatedShipItems = shipItems.filter(
                (i) => i.productId === psi.productId,
              );
              const lastShip = relatedShipItems
                .map((i) => shipById.get(i.shipmentId))
                .filter(Boolean)
                .sort((a, b) =>
                  a!.shippedAt < b!.shippedAt ? 1 : -1,
                )[0];

              return (
                <TableRow key={psi.id}>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold">{p?.code}</div>
                    <div className="text-sm font-medium">{p?.name}</div>
                  </TableCell>
                  <TableCell className="text-right text-lg font-semibold tabular-nums">
                    {psi.currentStock} {p?.unit}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {psi.lastProductionDate
                      ? formatDate(psi.lastProductionDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{loc?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {recentPo.length
                      ? recentPo.map((o) => o.orderNo).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {lastShip ? (
                      <div>
                        <div className="font-mono">{lastShip.shipmentNumber}</div>
                        <div className="text-slate-500">
                          {formatDateTime(lastShip.shippedAt)}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
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
