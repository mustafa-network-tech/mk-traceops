import Link from "next/link";

import { ImportBatchStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPlatformImportBatches } from "@/lib/data/platform-operational";
import { formatDateTime } from "@/lib/format";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PlatformExcelAktarimlarPage() {
  const batches = await listPlatformImportBatches();

  return (
    <div>
      <PageHeader
        title="Tüm fabrikalar — Excel aktarımları"
        description="Kiracı bazında yüklenen .xlsx partileri. Salt okunur; silme ve yeniden yükleme fabrika panelinden yapılır."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Excel aktarımları" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fabrika</TableHead>
              <TableHead>Dosya</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Satır</TableHead>
              <TableHead className="text-right">Başarılı</TableHead>
              <TableHead className="text-right">Hata</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Henüz aktarım yok veya liste boş döndü.</p>
                  <p className="mt-2 max-w-2xl">
                    Fabrikalar Excel yükledikçe burada görünür. Veri varken boşsa sunucuya{" "}
                    <code className="rounded bg-slate-100 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                    ekleyin (platform okumaları RLS&apos;yi aşar).
                    {!isSupabaseAdminConfigured() ? (
                      <span className="mt-1 block text-amber-800">
                        Service role anahtarı şu an yapılandırılmamış.
                      </span>
                    ) : null}
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
            {batches.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{b.factoryName}</div>
                  <div className="font-mono text-[10px] text-slate-500">{b.factorySlug}</div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-mono text-xs">
                  {b.fileName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDateTime(b.uploadedAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{b.rowCount}</TableCell>
                <TableCell className="text-right tabular-nums text-emerald-700">
                  {b.successCount}
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-800">
                  {b.errorCount}
                </TableCell>
                <TableCell>
                  <ImportBatchStatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/platform/excel-aktarimlar/${b.id}`}
                    className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
                  >
                    Aç
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
