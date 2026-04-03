import { StockMovementTypeLabel } from "@/components/domain/status-badges";
import { KokpitCharts } from "@/components/features/kokpit-charts";
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
import {
  listLocations,
  listMaterials,
  listSuppliers,
} from "@/lib/data/supabase-data";
import { formatDateTime, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/rbac/helpers";
import { getRbacSession } from "@/lib/rbac/session-server";
import {
  getDashboardMetrics,
  getProductionTrend,
  getRecentStockMovements,
  getStockMixChart,
} from "@/lib/services/dashboardService";
import { computeMrpShortages } from "@/lib/services/mrpService";

export default async function KokpitPage() {
  const ctx = await getRbacSession();
  const canReadProductionOrders = hasPermission(ctx, "production_orders", "read");
  const canMrp = hasPermission(ctx, "mrp", "read");

  const [m, recent, trend, mix, materials, locations, suppliers, mrpRows] =
    await Promise.all([
      getDashboardMetrics({
        includeProductionOrderMetrics: canReadProductionOrders,
      }),
      getRecentStockMovements(),
      Promise.resolve(getProductionTrend()),
      Promise.resolve(getStockMixChart()),
      listMaterials(),
      listLocations(),
      listSuppliers(),
      canMrp ? computeMrpShortages() : Promise.resolve([]),
    ]);

  const matById = new Map(materials.map((x) => [x.id, x]));
  const locById = new Map(locations.map((x) => [x.id, x]));
  const supById = new Map(suppliers.map((x) => [x.id, x]));

  const metrics = [
    { label: "Toplam parça kaydı", value: m.totalParts },
    { label: "Aktif montaj grubu", value: m.activeAssemblyGroups },
    { label: "Ham madde kalemi", value: m.rawMaterialCount },
    { label: "Sarf malzeme kalemi", value: m.consumableCount },
    { label: "Kritik stok uyarısı", value: m.criticalStockCount },
    ...(canMrp
      ? [{ label: "MRP risk kalemi", value: mrpRows.length }]
      : []),
    { label: "Bekleyen / üretimde UE", value: m.pendingProductionOrders },
    { label: "Bu ay tamamlanan UE", value: m.completedProductionThisMonth },
    { label: "Ürün stok SKU", value: m.productStockSkus },
    { label: "Açık sevkiyat", value: m.openShipments },
    { label: "Tedarikçi", value: m.supplierCount },
  ];

  return (
    <div>
      <PageHeader
        title="Kokpit"
        description="Operasyon akışının özeti: Excel aktarımından sevkiyata kadar modüllerle uyumlu metrikler (Supabase)."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((x) => (
          <Card key={x.label}>
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-medium text-slate-500">
                {x.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">
                {x.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <KokpitCharts trend={trend} mix={mix} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Son stok hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Malzeme</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((s) => {
                const mat = matById.get(s.materialId);
                const loc = locById.get(s.locationId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(s.occurredAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mat ? `${mat.code} — ${mat.name}` : s.materialId}
                    </TableCell>
                    <TableCell>
                      <StockMovementTypeLabel type={s.type} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(s.quantity, s.unit)}
                    </TableCell>
                    <TableCell className="text-sm">{loc?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-slate-600">
                      {s.note ??
                        (s.supplierId
                          ? `Tedarikçi: ${supById.get(s.supplierId)?.name ?? s.supplierId}`
                          : "—")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
