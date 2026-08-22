import Link from "next/link";

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
import { getImportBatchById } from "@/lib/data/import-queries";
import { listAssemblyGroups } from "@/lib/data/d1-data";
import type { ImportBatch } from "@/lib/types/models";

export const dynamic = "force-dynamic";

export default async function MontajGrupTakibiPage() {
  const groups = await listAssemblyGroups();
  const batchIds = [
    ...new Set(
      groups
        .map((g) => g.importBatchId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const batchById = new Map<string, ImportBatch>();
  await Promise.all(
    batchIds.map(async (bid) => {
      const b = await getImportBatchById(bid);
      if (b) batchById.set(bid, b);
    }),
  );

  return (
    <div>
      <PageHeader
        title="Montaj / grup takibi"
        description="Proje referansı, Excel aktarımı ile ilişki ve gruba bağlı parça detayları."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Montaj grupları" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Ad</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Aktarım</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const batch = g.importBatchId
                ? batchById.get(g.importBatchId)
                : undefined;
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {g.code}
                  </TableCell>
                  <TableCell>{g.name}</TableCell>
                  <TableCell className="text-sm">
                    {g.projectReference ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {batch?.fileName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/montaj-grup-takibi/${g.id}`}>Detay</Link>
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
