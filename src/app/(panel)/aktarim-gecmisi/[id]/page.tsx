import Link from "next/link";
import { notFound } from "next/navigation";

import { ImportRowStatusBadge } from "@/components/domain/status-badges";
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
import { DeleteImportBatchButton } from "@/components/features/delete-import-batch-button";
import {
  getImportBatchById,
  listImportRowsForBatch,
} from "@/lib/data/import-queries";
import {
  getPart,
  getUser,
  listAssemblyGroupsByBatchId,
  listPartsByBatchId,
} from "@/lib/data/supabase-data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AktarimBatchDetailPage({ params }: Props) {
  const { id } = await params;
  const batch = await getImportBatchById(id);
  if (!batch) notFound();

  const rows = await listImportRowsForBatch(id);
  const [parts, groups] = await Promise.all([
    listPartsByBatchId(id),
    listAssemblyGroupsByBatchId(id),
  ]);

  const linkedIds = [
    ...new Set(
      rows
        .map((r) => r.linkedPartId)
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const linkedParts = await Promise.all(linkedIds.map((pid) => getPart(pid)));
  const partById = new Map<string, NonNullable<(typeof linkedParts)[0]>>();
  for (const p of linkedParts) {
    if (p) partById.set(p.id, p);
  }
  for (const p of parts) {
    partById.set(p.id, p);
  }

  const agById = new Map(groups.map((g) => [g.id, g]));

  const uploader = batch.uploadedByUserId
    ? await getUser(batch.uploadedByUserId)
    : undefined;

  return (
    <div>
      <PageHeader
        title={batch.fileName}
        description={
          batch.notes ??
          "Aktarım partisi detayı — satır durumları ve oluşan parça kayıtları."
        }
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Aktarım geçmişi", href: "/aktarim-gecmisi" },
          { label: batch.fileName },
        ]}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DeleteImportBatchButton
              batchId={id}
              fileLabel={batch.fileName}
              redirectTo="/aktarim-gecmisi"
            />
            <Link
              href="/aktarim-gecmisi"
              className="text-sm text-slate-600 underline-offset-2 hover:underline"
            >
              Listeye dön
            </Link>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-slate-500">Yükleyen</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0 text-sm">
            {uploader?.fullName ??
              (batch.uploadedByUserId ? batch.uploadedByUserId : "—")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-slate-500">Yükleme zamanı</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0 text-sm">
            {formatDateTime(batch.uploadedAt)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-slate-500">Özet</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0 text-sm">
            {batch.successCount} başarılı · {batch.errorCount} hata ·{" "}
            {batch.rowCount} satır
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-slate-500">Montaj grupları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1 pb-3 pt-0">
            {groups.map((g) => (
              <Badge key={g.id} variant="secondary">
                {g.code}
              </Badge>
            ))}
            {groups.length === 0 ? "—" : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Satırlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ham veri</TableHead>
                <TableHead>Mesaj</TableHead>
                <TableHead>Bağlı parça</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.rowIndex}</TableCell>
                  <TableCell>
                    <ImportRowStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <pre className="whitespace-pre-wrap break-all text-xs text-slate-700">
                      {JSON.stringify(r.rawData)}
                    </pre>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {r.message ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.linkedPartId
                      ? partById.get(r.linkedPartId)?.partCode ??
                        r.linkedPartId
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bu aktarımdan oluşan parçalar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Operasyon</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead className="text-right">Adet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => {
                const ag = p.assemblyGroupId
                  ? agById.get(p.assemblyGroupId)
                  : undefined;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.partCode}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell>{p.operation}</TableCell>
                    <TableCell>{ag?.code ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
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
