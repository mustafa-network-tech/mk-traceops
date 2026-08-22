import { ProductionStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listPlatformProductionOrders,
  listPlatformStockMovements,
} from "@/lib/data/platform-operational";
import { formatDate, formatDateTime } from "@/lib/format";
import { isD1Configured } from "@/lib/d1/status";

export const dynamic = "force-dynamic";

const STOCK_TYPE_LABEL: Record<string, string> = {
  giriş: "Giriş",
  çıkış: "Çıkış",
  üretimde_kullanım: "Üretimde kullanım",
  iade: "İade",
  fire: "Fire",
  manuel_düzeltme: "Manuel düzeltme",
};

export default async function PlatformFabrikaHareketleriPage() {
  const [movements, orders] = await Promise.all([
    listPlatformStockMovements(350),
    listPlatformProductionOrders(120),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Fabrika hareketleri (izleme)"
        description="Tüm kiracılar için D1 üzerindeki son stok hareketleri ve üretim emri özeti."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Fabrika hareketleri" },
        ]}
      />

      {!isD1Configured() ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Üretim ortamında <code className="rounded bg-white px-1 text-xs">DB</code> binding tanımlı değil.
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Stok hareketleri</h2>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabrika</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Malzeme</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Lokasyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-600">
                    Kayıt yok.
                  </TableCell>
                </TableRow>
              ) : null}
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">{m.factoryName}</div>
                    <div className="font-mono text-[10px] text-slate-500">{m.factorySlug}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(m.occurredAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {STOCK_TYPE_LABEL[m.type] ?? m.type}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{m.materialCode}</div>
                    <div className="max-w-[200px] truncate text-xs text-slate-600">
                      {m.materialName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {m.quantity} {m.unit}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{m.locationCode}</span>
                    <span className="text-slate-500"> — {m.locationName}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Üretim emirleri</h2>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabrika</TableHead>
                <TableHead>Emir no</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Plan / üretilen</TableHead>
                <TableHead>Plan tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-600">
                    Kayıt yok.
                  </TableCell>
                </TableRow>
              ) : null}
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900">{o.factoryName}</div>
                    <div className="font-mono text-[10px] text-slate-500">{o.factorySlug}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{o.orderNo}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{o.productCode}</div>
                    <div className="max-w-[180px] truncate text-xs text-slate-600">
                      {o.productName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductionStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {o.quantityPlanned} / {o.quantityProduced}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDate(o.scheduledDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Üretim emri detayı şimdilik fabrika panelinde; platformda yalnızca çapraz fabrika listesi
          gösterilir.
        </p>
      </section>
    </div>
  );
}
