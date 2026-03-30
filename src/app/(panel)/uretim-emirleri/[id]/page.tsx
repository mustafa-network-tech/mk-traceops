import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductionStatusBadge } from "@/components/domain/status-badges";
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
import { formatDate, formatNumber } from "@/lib/format";
import {
  assemblyGroupRepository,
  departmentRepository,
  materialRepository,
  productRepository,
  productionOrderLineRepository,
  productionOrderRepository,
} from "@/lib/repositories";

type Props = { params: Promise<{ id: string }> };

export default async function UretimEmriDetayPage({ params }: Props) {
  const { id } = await params;
  const order = productionOrderRepository.getById(id);
  if (!order) notFound();

  const lines = productionOrderLineRepository.getByProductionOrderId(id);
  const product = productRepository.getById(order.productId);
  const ag = order.assemblyGroupId
    ? assemblyGroupRepository.getById(order.assemblyGroupId)
    : undefined;
  const dep = departmentRepository.getById(order.departmentId);

  return (
    <div>
      <PageHeader
        title={order.orderNo}
        description="Üretim emri malzeme kullanımı ve bağlam bilgileri."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Üretim emirleri", href: "/uretim-emirleri" },
          { label: order.orderNo },
        ]}
        actions={
          <Link
            href="/uretim-emirleri"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ürün</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-semibold">{product?.name}</div>
            <div className="font-mono text-xs text-slate-600">{product?.code}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              Tarih: <strong>{formatDate(order.scheduledDate)}</strong>
            </div>
            <div>
              Bölüm: <strong>{dep?.name}</strong>
            </div>
            <div>
              Montaj: <strong>{ag?.code ?? "—"}</strong>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Durum & miktar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ProductionStatusBadge status={order.status} />
            <div className="tabular-nums">
              Planlanan: <strong>{order.quantityPlanned}</strong> · Üretilen:{" "}
              <strong>{order.quantityProduced}</strong> {product?.unit}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Malzeme sarfiyatı</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Malzeme</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => {
                const m = materialRepository.getById(l.materialId);
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{m?.code}</div>
                      <div className="text-sm">{m?.name}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(l.quantityUsed, l.unit)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {l.note ?? "—"}
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
          <CardTitle>Emir notları</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            className="min-h-[100px] bg-slate-50"
            value={order.notes ?? "Not girilmemiş."}
          />
        </CardContent>
      </Card>
    </div>
  );
}
