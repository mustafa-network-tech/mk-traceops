import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductionStatusBadge } from "@/components/domain/status-badges";
import { DraftProductionWorkflowCard } from "@/components/features/draft-production-workflow-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import { ProductionOrderBomFillCard } from "@/components/features/production-order-bom-fill-card";
import { RecordProductionOutputForm } from "@/components/features/record-production-output-form";
import {
  getAssemblyGroup,
  getDepartment,
  getMaterial,
  getProduct,
  getProductionOrder,
  getProductionOrderBomPreview,
  getProductionOrderLines,
  listLocations,
} from "@/lib/data/supabase-data";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { hasPermission } from "@/lib/rbac/helpers";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { getRbacSession } from "@/lib/rbac/session-server";

type Props = { params: Promise<{ id: string }> };

export default async function UretimEmriDetayPage({ params }: Props) {
  await requirePanelModule("production_orders", "read");
  const ctx = await getRbacSession();
  const canRecordProductionOutput = hasPermission(ctx, "production_orders", "update");
  const canUpdateOrder = hasPermission(ctx, "production_orders", "update");

  const { id } = await params;
  const order = await getProductionOrder(id);
  if (!order) notFound();

  const [lines, product, ag, dep, locations, bomPreview] = await Promise.all([
    getProductionOrderLines(id),
    getProduct(order.productId),
    order.assemblyGroupId
      ? getAssemblyGroup(order.assemblyGroupId)
      : Promise.resolve(undefined),
    getDepartment(order.departmentId),
    listLocations(),
    getProductionOrderBomPreview(id),
  ]);

  const canFillBomLines =
    canUpdateOrder &&
    order.quantityProduced <= 0 &&
    order.status !== "iptal" &&
    order.status !== "tamamlandı";

  let fillBomBlockedHint: string | undefined;
  if (!canFillBomLines) {
    if (!canUpdateOrder) {
      fillBomBlockedHint = "Üretim emri güncelleme yetkisi gerekir.";
    } else if (order.quantityProduced > 0) {
      fillBomBlockedHint =
        "Üretim çıkışı kaydı varken BOM satırları değiştirilemez.";
    } else if (order.status === "iptal" || order.status === "tamamlandı") {
      fillBomBlockedHint = "İptal veya tamamlanmış emirde işlem yapılamaz.";
    }
  }

  const maxGoodQty = Math.max(0, order.quantityPlanned - order.quantityProduced);
  const canShowOutputForm =
    canRecordProductionOutput &&
    maxGoodQty > 0 &&
    (order.status === "planlandı" || order.status === "üretimde") &&
    Boolean(order.approvedAt);
  const showDraftWorkflow =
    order.status === "taslak" && canRecordProductionOutput;
  const showMissingApprovalHint =
    canRecordProductionOutput &&
    (order.status === "planlandı" || order.status === "üretimde") &&
    !order.approvedAt;

  const materials = await Promise.all(
    lines.map((l) => getMaterial(l.materialId)),
  );
  const matByLineId = new Map(lines.map((l, i) => [l.id, materials[i]]));

  return (
    <div>
      <PageHeader
        title={order.orderNo}
        description="Kurallar: taslak emirlerde stok çıkışı yoktur — önce «Planlamaya al (onay)». Üretim çıkışı yalnız onaylı (planlandı/üretimde) emirlerde kaydedilir."
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
            <div className="flex flex-wrap items-center gap-2">
              {order.approvedAt ? (
                <Badge variant="success">Onaylı</Badge>
              ) : order.status === "taslak" ? (
                <Badge variant="warning">Onay bekliyor</Badge>
              ) : (
                <Badge variant="muted">Onay kaydı yok</Badge>
              )}
            </div>
            <div className="tabular-nums">
              Planlanan: <strong>{order.quantityPlanned}</strong> · Üretilen:{" "}
              <strong>{order.quantityProduced}</strong> {product?.unit}
            </div>
            {order.approvedAt ? (
              <div className="text-xs text-slate-600">
                Onay: {formatDateTime(order.approvedAt)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {showDraftWorkflow ? (
        <DraftProductionWorkflowCard orderId={order.id} orderNo={order.orderNo} />
      ) : null}

      {showMissingApprovalHint ? (
        <Card className="mb-4 border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-base text-red-900">Onay kaydı eksik</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-900">
            Bu emir planlı görünüyor ancak veritabanında onay zamanı (`approved_at`) yok. Üretim
            çıkışı için `20260330230000_production_order_approval` migration dosyasını uygulayın veya
            kaydı onay akışından geçirin.
          </CardContent>
        </Card>
      ) : null}

      {canShowOutputForm ? (
        <RecordProductionOutputForm
          orderId={order.id}
          orderNo={order.orderNo}
          maxGoodQty={maxGoodQty}
          productUnit={product?.unit ?? "adet"}
          locations={locations}
        />
      ) : null}

      <ProductionOrderBomFillCard
        orderId={order.id}
        preview={bomPreview}
        hasExistingLines={lines.length > 0}
        canFill={canFillBomLines}
        fillBlockedHint={fillBomBlockedHint}
      />

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
                const m = matByLineId.get(l.id);
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
