import Link from "next/link";

import { ProductionStatusBadge } from "@/components/domain/status-badges";
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
import { formatDate } from "@/lib/format";
import {
  assemblyGroupRepository,
  departmentRepository,
  productRepository,
  productionOrderRepository,
} from "@/lib/repositories";

export default function UretimEmirleriPage() {
  const orders = productionOrderRepository.getAll();

  return (
    <div>
      <PageHeader
        title="Üretim emirleri"
        description="Mamul, montaj grubu, planlanan/üretilen miktar ve bölüm. Malzeme sarfiyatı detay sayfasında satır bazlı görülür."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Üretim emirleri" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emir no</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Montaj</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Plan</TableHead>
              <TableHead className="text-right">Üretilen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Bölüm</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const prod = productRepository.getById(o.productId);
              const ag = o.assemblyGroupId
                ? assemblyGroupRepository.getById(o.assemblyGroupId)
                : undefined;
              const dep = departmentRepository.getById(o.departmentId);
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {o.orderNo}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{prod?.name}</div>
                    <div className="font-mono text-xs text-slate-500">
                      {prod?.code}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{ag?.code ?? "—"}</TableCell>
                  <TableCell>
                    <ProductionStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.quantityPlanned}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.quantityProduced}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(o.scheduledDate)}
                  </TableCell>
                  <TableCell className="text-sm">{dep?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/uretim-emirleri/${o.id}`}>Detay</Link>
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
