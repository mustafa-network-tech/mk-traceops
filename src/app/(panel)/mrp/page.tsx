import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { computeMrpShortages } from "@/lib/services/mrpService";

export default async function MrpPage() {
  await requirePanelModule("mrp", "read");
  const rows = await computeMrpShortages();

  return (
    <div>
      <PageHeader
        title="MRP / Malzeme ihtiyacı"
        description="Min. stok altı kalemler ve açık üretim emirleri (planlandı / üretimde) için hesaplanan net eksikler. UE satırı yoksa mamul kodu/adı ile eşleşen parça ve veritabanındaki patlatılmış BOM (alt parça ağacı + tüm kademelerdeki malzeme satırları) kullanılır."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "MRP / İhtiyaç" },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Şu an risk satırı yok: açık emirler için hesaplanan ihtiyaç mevcut stokla karşılanıyor ve
          min. stok eşiğinin altında kalem bulunmuyor.
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Malzeme</TableHead>
                <TableHead className="text-right">Mevcut</TableHead>
                <TableHead className="text-right">Min.</TableHead>
                <TableHead className="text-right">UE ihtiyaç</TableHead>
                <TableHead className="text-right">UE eksik</TableHead>
                <TableHead className="text-right">Min. üstü</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Emirler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.material.id}>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold">{r.material.code}</div>
                    <div className="text-sm">{r.material.name}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatNumber(r.material.currentStock, r.material.unit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatNumber(r.material.minStock, r.material.unit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {formatNumber(r.demandFromOpenOrders, r.material.unit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-amber-800">
                    {r.shortageAfterStock > 0
                      ? formatNumber(r.shortageAfterStock, r.material.unit)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {r.shortToMin > 0
                      ? formatNumber(r.shortToMin, r.material.unit)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {r.belowMin ? (
                      <Badge variant="danger">Min. altı</Badge>
                    ) : (
                      <Badge variant="outline">UE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-slate-600">
                    {r.orderRefs.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="list-inside list-disc space-y-0.5">
                        {r.orderRefs.map((ref) => (
                          <li key={ref.orderId}>
                            <Link
                              href={`/uretim-emirleri/${ref.orderId}`}
                              className="text-sky-700 underline-offset-2 hover:underline"
                            >
                              {ref.orderNo}
                            </Link>
                            <span className="text-slate-500">
                              {" "}
                              ({formatNumber(ref.quantity, r.material.unit)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
