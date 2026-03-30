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
import { formatDateTime } from "@/lib/format";
import { importBatchRepository, userRepository } from "@/lib/repositories";

export default function AktarimGecmisiPage() {
  const batches = importBatchRepository.getAll();

  return (
    <div>
      <PageHeader
        title="Aktarım geçmişi"
        description="Excel yüklemeleri, satır sayıları ve durum. Detaydan satır bazlı durum ve oluşan parça önizlemesine gidin."
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b) => {
              const u = userRepository.getById(b.uploadedByUserId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.fileName}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(b.uploadedAt)}
                  </TableCell>
                  <TableCell>{u?.fullName ?? b.uploadedByUserId}</TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
