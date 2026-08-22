import { OperationStatusBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listCompanies,
  listOperationAssignments,
  listParts,
} from "@/lib/data/d1-data";
import { formatDate } from "@/lib/format";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";

export default async function IsAtamaPage() {
  await requirePanelModule("production_orders", "read");

  const [assignments, parts, companies] = await Promise.all([
    listOperationAssignments(),
    listParts(),
    listCompanies(),
  ]);

  const partById = new Map(parts.map((p) => [p.id, p]));
  const compById = new Map(companies.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader
        title="İş atama / planlama"
        description="Parça bazlı operasyonlar ve dış/iç firma atamaları. Üretim emirleri ile birlikte kapasite planlamasına temel oluşturur."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "İş atama" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parça</TableHead>
              <TableHead>Operasyon</TableHead>
              <TableHead>Atanan firma</TableHead>
              <TableHead>Plan tarihi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Not</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => {
              const p = partById.get(a.partId);
              const c = compById.get(a.assignedCompanyId);
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="font-mono text-xs">{p?.partCode}</span>
                    <div className="text-xs text-slate-600">{p?.description}</div>
                  </TableCell>
                  <TableCell>{a.operationName}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{c?.name}</div>
                    {c?.isExternalManufacturer ? (
                      <span className="text-xs text-amber-700">Dış işlem</span>
                    ) : (
                      <span className="text-xs text-slate-500">İç</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {a.plannedDate ? formatDate(a.plannedDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <OperationStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-600">
                    {a.notes ?? "—"}
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
