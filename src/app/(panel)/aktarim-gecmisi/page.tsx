import Link from "next/link";

import { ImportBatchStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteImportBatchButton } from "@/components/features/delete-import-batch-button";
import { listImportBatches } from "@/lib/data/import-queries";
import { getUser } from "@/lib/data/supabase-data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AktarimGecmisiPage() {
  const batches = await listImportBatches();

  const uploaderIds = [
    ...new Set(
      batches
        .map((b) => b.uploadedByUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const users = await Promise.all(uploaderIds.map((uid) => getUser(uid)));
  const userById = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));

  return (
    <div>
      <PageHeader
        title="Aktarım geçmişi"
        description="Excel yüklemeleri, satır sayıları ve durum. Test aşamasında eski aktarımları silebilirsiniz (parçalar ve bu batch montaj grupları da kaldırılır)."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Aktarım geçmişi" },
        ]}
        actions={
          <Button asChild variant="secondary">
            <Link href="/excel-aktarim">Yeni aktarım</Link>
          </Button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dosya</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Yükleyen</TableHead>
              <TableHead className="text-right">Satır</TableHead>
              <TableHead className="text-right">Başarılı</TableHead>
              <TableHead className="text-right">Hata</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Detay</TableHead>
              <TableHead className="text-right">Sil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-600">
                  Henüz kayıt yok.{" "}
                  <Link href="/excel-aktarim" className="font-medium text-slate-800 underline">
                    Excel aktarımından
                  </Link>{" "}
                  yükleyin.
                </TableCell>
              </TableRow>
            ) : null}
            {batches.map((b) => {
              const u = b.uploadedByUserId
                ? userById.get(b.uploadedByUserId)
                : undefined;
              const uploaderLabel =
                u?.fullName ??
                (b.uploadedByUserId ? b.uploadedByUserId : "—");
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.fileName}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(b.uploadedAt)}
                  </TableCell>
                  <TableCell>{uploaderLabel}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.rowCount}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-700">
                    {b.successCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-700">
                    {b.errorCount}
                  </TableCell>
                  <TableCell>
                    <ImportBatchStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/aktarim-gecmisi/${b.id}`}>Detay</Link>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteImportBatchButton
                      batchId={b.id}
                      fileLabel={b.fileName}
                      variant="outline"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
