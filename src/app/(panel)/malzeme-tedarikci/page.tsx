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
import {
  getMaterial,
  listMaterialSupplierRelations,
  listSuppliers,
} from "@/lib/data/supabase-data";
import { formatCurrency, formatDate } from "@/lib/format";

type Props = {
  searchParams: Promise<{ malzeme?: string }>;
};

export default async function MalzemeTedarikciPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filterMaterialId = sp.malzeme;
  const allRels = await listMaterialSupplierRelations();
  const rels = allRels.filter(
    (r) => !filterMaterialId || r.materialId === filterMaterialId,
  );

  const [materials, suppliers] = await Promise.all([
    Promise.all([...new Set(rels.map((r) => r.materialId))].map(getMaterial)),
    listSuppliers(),
  ]);

  const matById = new Map(materials.filter(Boolean).map((m) => [m!.id, m!]));
  const supById = new Map(suppliers.map((s) => [s.id, s]));

  const filterMaterial = filterMaterialId
    ? await getMaterial(filterMaterialId)
    : undefined;

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
            {filterMaterial?.code ?? filterMaterialId}
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
              const m = matById.get(r.materialId);
              const s = supById.get(r.supplierId);
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
