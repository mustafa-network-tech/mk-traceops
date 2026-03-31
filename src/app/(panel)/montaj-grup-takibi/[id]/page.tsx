import Link from "next/link";
import { notFound } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
import { getImportBatchById } from "@/lib/data/import-queries";
import {
  getAssemblyGroup,
  listCompanies,
  listMaterials,
  listPartsByAssemblyGroupId,
  listProductionOrders,
} from "@/lib/data/supabase-data";

type Props = { params: Promise<{ id: string }> };

export default async function MontajGrupDetayPage({ params }: Props) {
  const { id } = await params;
  const g = await getAssemblyGroup(id);
  if (!g) notFound();

  const [parts, materials, companies, allOrders] = await Promise.all([
    listPartsByAssemblyGroupId(id),
    listMaterials(),
    listCompanies(),
    listProductionOrders(),
  ]);

  const matById = new Map(materials.map((m) => [m.id, m]));
  const compById = new Map(companies.map((c) => [c.id, c]));
  const orders = allOrders.filter((o) => o.assemblyGroupId === id);

  const batch = g.importBatchId
    ? await getImportBatchById(g.importBatchId)
    : undefined;

  return (
    <div>
      <PageHeader
        title={`${g.code} — ${g.name}`}
        description={
          g.notes ?? "Montaj grubuna bağlı parçalar ve ilgili üretim emirleri."
        }
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Montaj grupları", href: "/montaj-grup-takibi" },
          { label: g.code },
        ]}
        actions={
          <Link
            href="/montaj-grup-takibi"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Proje</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {g.projectReference ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kaynak aktarım</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {batch?.fileName ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">İlgili üretim emri</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {orders.length ? orders.map((o) => o.orderNo).join(", ") : "—"}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Parçalar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Malzeme</TableHead>
                <TableHead>Operasyon</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead className="text-right">Adet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p) => {
                const m = p.materialId ? matById.get(p.materialId) : undefined;
                const c = p.assignedCompanyId
                  ? compById.get(p.assignedCompanyId)
                  : undefined;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.partCode}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell className="text-xs">{m?.code ?? "—"}</TableCell>
                    <TableCell>{p.operation}</TableCell>
                    <TableCell className="text-sm">{c?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grup notları</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            className="bg-slate-50"
            value={g.notes ?? "Not yok."}
          />
        </CardContent>
      </Card>
    </div>
  );
}
