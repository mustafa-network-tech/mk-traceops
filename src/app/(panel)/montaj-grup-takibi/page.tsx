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
import { assemblyGroupRepository, importBatchRepository } from "@/lib/repositories";

export default function MontajGrupTakibiPage() {
  const groups = assemblyGroupRepository.getAll();

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
                ? importBatchRepository.getById(g.importBatchId)
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
