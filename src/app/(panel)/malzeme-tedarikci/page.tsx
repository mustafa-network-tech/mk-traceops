import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  materialRepository,
  materialSupplierRelationRepository,
  supplierRepository,
} from "@/lib/repositories";

type Props = {
  searchParams: Promise<{ malzeme?: string }>;
};

export default async function MalzemeTedarikciPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filterMaterialId = sp.malzeme;
  const rels = materialSupplierRelationRepository
    .getAll()
    .filter((r) => !filterMaterialId || r.materialId === filterMaterialId);

  return (
    <div>
      <PageHeader
        title="Malzeme — tedarikçi ilişkileri"
        description="İlişkisel model: her malzeme için birden fazla tedarikçi, birincil bayrak, öncelik sırası ve son alım fiyatı."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Malzeme–tedarikçi" },
        ]}
      />

      {filterMaterialId ? (
        <p className="mb-3 text-sm text-slate-600">
          Filtre:{" "}
          <strong>
            {materialRepository.getById(filterMaterialId)?.code ?? filterMaterialId}
          </strong>{" "}
          — tüm malzemeler için filtreyi kaldırın: URL parametresini silin.
        </p>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Malzeme</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead>Birincil</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead className="text-right">Son fiyat</TableHead>
              <TableHead>Son alım</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rels.map((r) => {
              const m = materialRepository.getById(r.materialId);
              const s = supplierRepository.getById(r.supplierId);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-mono text-xs">{m?.code}</div>
                    <div className="text-sm">{m?.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{s?.name}</div>
                    <div className="text-xs text-slate-500">{s?.phone}</div>
                  </TableCell>
                  <TableCell>
                    {r.isPrimary ? (
                      <Badge variant="success">Birincil</Badge>
                    ) : (
                      <Badge variant="outline">Alternatif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.priorityOrder}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(r.lastPurchasePrice, r.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(r.lastPurchaseDate)}
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
