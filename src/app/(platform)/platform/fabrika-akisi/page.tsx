import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listPlatformImportBatches,
  listPlatformProductionOrders,
  listPlatformStockMovements,
} from "@/lib/data/platform-operational";
import { listFactories } from "@/lib/data/rbac-data";

export const dynamic = "force-dynamic";

export default async function PlatformFabrikaAkisiPage() {
  const [factories, batches, movements, orders] = await Promise.all([
    listFactories(),
    listPlatformImportBatches(),
    listPlatformStockMovements(5),
    listPlatformProductionOrders(5),
  ]);

  const lastExcel = batches[0];
  const lastMove = movements[0];
  const lastPo = orders[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fabrika akışı & izleme"
        description="Kiracıların günlük operasyonunu (Excel, depo, üretim) platformdan salt okunur takip edin. Düzenleme ve veri girişi fabrika panelindedir."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Fabrika akışı & izleme" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-violet-200 bg-violet-50/40 shadow-sm ring-1 ring-violet-100">
          <CardHeader>
            <CardTitle className="text-lg text-violet-950">Excel & veri girişi</CardTitle>
            <CardDescription className="text-violet-900/80">
              Hangi fabrikanın ne zaman .xlsx yüklediği, satır ve hata özeti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/platform/excel-aktarimlar">Tüm fabrikaların Excel aktarımları</Link>
            </Button>
            {lastExcel ? (
              <p className="text-xs text-slate-600">
                Son kayıt: <span className="font-medium">{lastExcel.factoryName}</span> —{" "}
                <span className="font-mono">{lastExcel.fileName}</span> (
                {new Date(lastExcel.uploadedAt).toLocaleString("tr-TR")})
              </p>
            ) : (
              <p className="text-xs text-slate-500">Henüz aktarım yok veya liste boş.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-violet-50/40 shadow-sm ring-1 ring-violet-100">
          <CardHeader>
            <CardTitle className="text-lg text-violet-950">Depo & üretim akışı</CardTitle>
            <CardDescription className="text-violet-900/80">
              Malzeme stok hareketleri ve üretim emirleri — tüm kiracılar birlikte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="/platform/fabrika-hareketleri">Stok hareketleri & üretim emirleri</Link>
            </Button>
            {lastMove ? (
              <p className="text-xs text-slate-600">
                Son stok: <span className="font-medium">{lastMove.factoryName}</span> —{" "}
                {lastMove.type} · {lastMove.materialCode} · {lastMove.quantity} {lastMove.unit}
              </p>
            ) : null}
            {lastPo ? (
              <p className="text-xs text-slate-600">
                Son UE: <span className="font-medium">{lastPo.factoryName}</span> —{" "}
                <span className="font-mono">{lastPo.orderNo}</span> ({lastPo.status})
              </p>
            ) : null}
            {!lastMove && !lastPo ? (
              <p className="text-xs text-slate-500">Henüz hareket / emir yok veya liste boş.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipik akış (özet)</CardTitle>
          <CardDescription>Fabrika panelinde kullanıcıların izlediği sıra</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Excel ile parça / malzeme / montaj verisi yüklenir (aktarım geçmişi).</li>
            <li>Stok hareketleri ve üretim emirleri fabrika kullanıcıları tarafından işletilir.</li>
            <li>Mamul stoğu ve sevkiyat fabrika panelinden yönetilir.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/platform/fabrikalar">Fabrika listesi ({factories.length})</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/platform/fabrika-talepleri">Kayıt talepleri</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
