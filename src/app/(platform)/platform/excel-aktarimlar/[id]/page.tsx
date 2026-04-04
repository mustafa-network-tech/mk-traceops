import Link from "next/link";
import { notFound } from "next/navigation";

import { ImportRowStatusBadge } from "@/components/domain/status-badges";
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
  getPlatformImportBatch,
  listPlatformImportRows,
  listPlatformPartsByImportBatch,
} from "@/lib/data/platform-operational";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PlatformExcelAktarimDetayPage({ params }: Props) {
  const { id } = await params;
  const batch = await getPlatformImportBatch(id);
  if (!batch) notFound();

  const [rows, parts] = await Promise.all([
    listPlatformImportRows(id),
    listPlatformPartsByImportBatch(id),
  ]);

  return (
    <div>
      <PageHeader
        title={batch.fileName}
        description={`${batch.factoryName} · Salt okunur platform görünümü.`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Excel aktarımları", href: "/platform/excel-aktarimlar" },
          { label: batch.fileName },
        ]}
        actions={
          <Link
            href="/platform/excel-aktarimlar"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Fabrika</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">{batch.factoryName}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Yüklenme</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{formatDateTime(batch.uploadedAt)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Satır / başarı / hata</CardTitle>
          </CardHeader>
          <CardContent className="text-sm tabular-nums">
            {batch.rowCount} · {batch.successCount} · {batch.errorCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-slate-500">Oluşan parça</CardTitle>
          </CardHeader>
          <CardContent className="text-sm tabular-nums">{parts.length}</CardContent>
        </Card>
      </div>

      {parts.length > 0 ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Bu aktarımdan oluşan parçalar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.partCode}</TableCell>
                    <TableCell className="text-sm text-slate-700">{p.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktarım satırları</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Mesaj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-slate-500">
                    Satır yok.
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tabular-nums text-xs">{r.rowIndex}</TableCell>
                  <TableCell>
                    <ImportRowStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-xl text-xs text-slate-600">
                    {r.message ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
