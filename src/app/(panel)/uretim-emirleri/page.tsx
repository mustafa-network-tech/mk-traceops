import Link from "next/link";

import { ProductionStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
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
import { CreateDraftProductionOrderForm } from "@/components/features/create-draft-production-order-form";
import {
  listAssemblyGroups,
  listDepartments,
  listProducts,
  listProductionOrders,
} from "@/lib/data/d1-data";
import { formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/rbac/helpers";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function UretimEmirleriPage() {
  await requirePanelModule("production_orders", "read");
  const ctx = await getRbacSession();
  const canCreateOrder = hasPermission(ctx, "production_orders", "create");

  const [orders, products, assemblies, departments] = await Promise.all([
    listProductionOrders(),
    listProducts(),
    listAssemblyGroups(),
    listDepartments(),
  ]);

  const prodById = new Map(products.map((p) => [p.id, p]));
  const agById = new Map(assemblies.map((a) => [a.id, a]));
  const depById = new Map(departments.map((d) => [d.id, d]));

  return (
    <div>
      <PageHeader
        title="Üretim emirleri"
        description="Taslak emirler onaylanmadan stok çıkışına kapalıdır. Onaylı kalemlerde üretim çıkışı kullanılır. Detayda malzeme sarfiyatı satır bazlıdır."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Üretim emirleri" },
        ]}
      />

      {canCreateOrder ? (
        <CreateDraftProductionOrderForm
          products={products}
          departments={departments}
          assemblies={assemblies}
        />
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emir no</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Montaj</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Onay</TableHead>
              <TableHead className="text-right">Plan</TableHead>
              <TableHead className="text-right">Üretilen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Bölüm</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const prod = prodById.get(o.productId);
              const ag = o.assemblyGroupId
                ? agById.get(o.assemblyGroupId)
                : undefined;
              const dep = depById.get(o.departmentId);
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {o.orderNo}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{prod?.name}</div>
                    <div className="font-mono text-xs text-slate-500">
                      {prod?.code}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{ag?.code ?? "—"}</TableCell>
                  <TableCell>
                    <ProductionStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    {o.approvedAt ? (
                      <Badge variant="success">Evet</Badge>
                    ) : o.status === "taslak" ? (
                      <Badge variant="warning">Bekliyor</Badge>
                    ) : (
                      <Badge variant="muted">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.quantityPlanned}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.quantityProduced}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(o.scheduledDate)}
                  </TableCell>
                  <TableCell className="text-sm">{dep?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/uretim-emirleri/${o.id}`}>Detay</Link>
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
