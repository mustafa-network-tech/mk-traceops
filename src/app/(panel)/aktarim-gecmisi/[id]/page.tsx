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
import {
  getImportBatchById,
  listImportRowsForBatch,
} from "@/lib/data/import-queries";
import { formatDateTime } from "@/lib/format";
import {
  assemblyGroupRepository,
  partRepository,
  userRepository,
} from "@/lib/repositories";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AktarimBatchDetailPage({ params }: Props) {
  const { id } = await params;
  const batch = await getImportBatchById(id);
  if (!batch) notFound();

  const rows = await listImportRowsForBatch(id);
  const parts = partRepository.getByBatchId(id);
  const groups = assemblyGroupRepository.getByImportBatchId(id);
  const uploader = batch.uploadedByUserId
    ? userRepository.getById(batch.uploadedByUserId)
    : undefined;

  return (
    <div>
      <PageHeader
        title={batch.fileName}
        description={
          batch.notes ??
          "Aktarım partisi detayı — satır durumları. Parça kayıtları, bu batch ile eşleşen mock veride varsa listelenir."
        }
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Aktarım geçmişi", href: "/aktarim-gecmisi" },
          { label: batch.fileName },
        ]}
        actions={
          <Link
            href="/aktarim-gecmisi"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
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
                      ? partRepository.getById(r.linkedPartId)?.partCode ??
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
                  ? assemblyGroupRepository.getById(p.assemblyGroupId)
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
