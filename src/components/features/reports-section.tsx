"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  ProductionStatusBadge,
  ShipmentStatusBadge,
  StockMovementTypeLabel,
} from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadReportsBundle, type ReportsBundle } from "@/app/actions/reports";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type {
  AssemblyGroup,
  Material,
  Product,
  ProductionOrder,
  ReportFilter,
  Supplier,
} from "@/lib/types/models";

export type ReportsSectionProps = {
  materials: Material[];
  suppliers: Supplier[];
  products: Product[];
  assemblies: AssemblyGroup[];
};

export function ReportsSection({
  materials,
  suppliers,
  products,
  assemblies,
}: ReportsSectionProps) {
  const [tab, setTab] = useState("stok");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-30");
  const [materialId, setMaterialId] = useState<string>("all");
  const [supplierId, setSupplierId] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [shipStatus, setShipStatus] = useState<string>("all");
  const [prodStatus, setProdStatus] = useState<string>("all");
  const [assemblyId, setAssemblyId] = useState<string>("all");

  const baseFilter = useMemo((): ReportFilter => {
    const f: ReportFilter = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
    if (materialId !== "all") f.materialId = materialId;
    if (supplierId !== "all") f.supplierId = supplierId;
    if (productId !== "all") f.productId = productId;
    if (shipStatus !== "all") f.shipmentStatus = shipStatus as ReportFilter["shipmentStatus"];
    if (prodStatus !== "all") f.productionStatus = prodStatus as ReportFilter["productionStatus"];
    if (assemblyId !== "all") f.assemblyGroupId = assemblyId;
    return f;
  }, [
    dateFrom,
    dateTo,
    materialId,
    supplierId,
    productId,
    shipStatus,
    prodStatus,
    assemblyId,
  ]);

  const [bundle, setBundle] = useState<ReportsBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    loadReportsBundle(baseFilter)
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Rapor verisi yüklenemedi.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [baseFilter]);

  const b = bundle;

  return (
    <div>
      <PageHeader
        title="Raporlama"
        description="Stok, sarfiyat, tedarikçi fiyatları, üretim, mamul stoğu, sevkiyat ve tekrar eden işler — filtreler rapor sekmesine uygulanır."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Raporlama" },
        ]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Ortak filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="space-y-1.5">
            <Label>Başlangıç</Label>
            <input
              type="date"
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Bitiş</Label>
            <input
              type="date"
              className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Malzeme</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tedarikçi</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ürün</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Montaj grubu</Label>
            <Select value={assemblyId} onValueChange={setAssemblyId}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {assemblies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sevkiyat durumu</Label>
            <Select value={shipStatus} onValueChange={setShipStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="taslak">Taslak</SelectItem>
                <SelectItem value="hazırlanıyor">Hazırlanıyor</SelectItem>
                <SelectItem value="yola_çıktı">Yolda</SelectItem>
                <SelectItem value="teslim_edildi">Teslim</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Üretim durumu</Label>
            <Select value={prodStatus} onValueChange={setProdStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="taslak">Taslak</SelectItem>
                <SelectItem value="planlandı">Planlandı</SelectItem>
                <SelectItem value="üretimde">Üretimde</SelectItem>
                <SelectItem value="tamamlandı">Tamamlandı</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <p className="mb-3 text-sm text-red-600">{loadError}</p>
      ) : null}
      {b === null && !loadError ? (
        <p className="mb-3 text-sm text-slate-600">Rapor verileri yükleniyor…</p>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="stok">Stok hareket</TabsTrigger>
          <TabsTrigger value="kullanim">Malzeme kullanım</TabsTrigger>
          <TabsTrigger value="fiyat">Tedarikçi fiyat</TabsTrigger>
          <TabsTrigger value="uretim">Üretim</TabsTrigger>
          <TabsTrigger value="mamul">Ürün stok</TabsTrigger>
          <TabsTrigger value="sevk">Sevkiyat</TabsTrigger>
          <TabsTrigger value="tekrar">Tekrar eden</TabsTrigger>
        </TabsList>

        <TabsContent value="stok">
          <ReportCard title="Stok hareket raporu">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Malzeme</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.stock ?? []).map(({ movement, material }) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(movement.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">{material?.code}</div>
                      <div className="text-sm">{material?.name}</div>
                    </TableCell>
                    <TableCell>
                      <StockMovementTypeLabel type={movement.type} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(movement.quantity, movement.unit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="kullanim">
          <ReportCard title="Malzeme kullanım raporu (üretim emri satırları)">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Malzeme</TableHead>
                  <TableHead>Üretim emri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.kullanim ?? []).map(
                  ({ line, material, order, product }) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-mono text-xs">{material?.code}</div>
                        <div className="text-sm">{material?.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order?.orderNo}
                      </TableCell>
                      <TableCell className="text-sm">{product?.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(line.quantityUsed, line.unit)}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="fiyat">
          <ReportCard title="Tedarikçi bazlı son fiyat">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Malzeme</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Birincil</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.fiyat ?? [])
                  .filter(
                    (r) =>
                      (materialId === "all" ||
                        r.relation.materialId === materialId) &&
                      (supplierId === "all" ||
                        r.relation.supplierId === supplierId),
                  )
                  .map(({ relation, material, supplier }) => (
                    <TableRow key={relation.id}>
                      <TableCell>
                        <div className="font-mono text-xs">{material?.code}</div>
                        <div className="text-sm">{material?.name}</div>
                      </TableCell>
                      <TableCell className="text-sm">{supplier?.name}</TableCell>
                      <TableCell>
                        {relation.isPrimary ? (
                          <Badge variant="success">Birincil</Badge>
                        ) : (
                          <Badge variant="outline">Alt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(
                          relation.lastPurchasePrice,
                          relation.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(relation.lastPurchaseDate)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="uretim">
          <ReportCard title="Üretim raporu">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emir</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Montaj</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Plan / Üretilen</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.uretim ?? []).map(({ order, product, assembly }) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {order.orderNo}
                    </TableCell>
                    <TableCell className="text-sm">{product?.name}</TableCell>
                    <TableCell className="text-xs">
                      {assembly?.code ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ProductionStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {order.quantityPlanned} / {order.quantityProduced}
                    </TableCell>
                    <TableCell>{formatDate(order.scheduledDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="mamul">
          <ReportCard title="Ürün stok raporu">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead>Son üretim</TableHead>
                  <TableHead>Yakın UE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.mamul ?? [])
                  .filter(
                    (r) => productId === "all" || r.stock.productId === productId,
                  )
                  .map(({ stock, product, recentOrders }) => (
                    <TableRow key={stock.id}>
                      <TableCell>
                        <div className="font-mono text-xs">{product?.code}</div>
                        <div className="text-sm">{product?.name}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {stock.currentStock}
                      </TableCell>
                      <TableCell>
                        {stock.lastProductionDate
                          ? formatDate(stock.lastProductionDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {recentOrders.map((o: ProductionOrder) => o.orderNo).join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="sevk">
          <ReportCard title="Sevkiyat raporu">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kalemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.sevk ?? []).map(({ shipment, items }) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono text-xs">
                      {shipment.shipmentNumber}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDateTime(shipment.shippedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {shipment.recipientName}
                    </TableCell>
                    <TableCell>
                      <ShipmentStatusBadge status={shipment.status} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {items
                        .map(
                          (i) =>
                            `${i.product?.code ?? "?"}×${i.item.quantity}`,
                        )
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>

        <TabsContent value="tekrar">
          <ReportCard title="Tekrar eden işler raporu">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tekrar</TableHead>
                  <TableHead>Gruplar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(b?.tekrar ?? []).map((r) => (
                  <TableRow key={r.partCode}>
                    <TableCell className="font-mono text-xs">{r.partCode}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {r.occurrenceCount}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.assemblyGroupCodes.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
