import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/format";
import {
  materialRepository,
  materialSupplierRelationRepository,
  supplierRepository,
} from "@/lib/repositories";

type Props = { params: Promise<{ id: string }> };

export default async function TedarikciDetayPage({ params }: Props) {
  const { id } = await params;
  const s = supplierRepository.getById(id);
  if (!s) notFound();

  const rels = materialSupplierRelationRepository.getBySupplierId(id);

  return (
    <div>
      <PageHeader
        title={s.name}
        description="İletişim, notlar ve bu tedarikçi için tutulan son satınalma fiyatları."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Tedarikçiler", href: "/tedarikciler" },
          { label: s.name },
        ]}
        actions={
          <Link
            href="/tedarikciler"
            className="text-sm text-slate-600 underline-offset-2 hover:underline"
          >
            Listeye dön
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">İletişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Yetkili: {s.contactPerson ?? "—"}</div>
            <div>Telefon: {s.phone ?? "—"}</div>
            <div>WhatsApp: {s.whatsapp ?? "—"}</div>
            <div>E-posta: {s.email ?? "—"}</div>
            <div>Şehir: {s.city ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea readOnly className="bg-slate-50" value={s.notes ?? "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İlişkili malzemeler ve son fiyatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Malzeme</TableHead>
                <TableHead>Birincil</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead className="text-right">Son fiyat</TableHead>
                <TableHead>Para birimi</TableHead>
                <TableHead>Son alım tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rels.map((r) => {
                const m = materialRepository.getById(r.materialId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{m?.code}</div>
                      <div className="text-sm">{m?.name}</div>
                    </TableCell>
                    <TableCell>
                      {r.isPrimary ? (
                        <Badge variant="success">Evet</Badge>
                      ) : (
                        <Badge variant="muted">Hayır</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{r.priorityOrder}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(r.lastPurchasePrice, r.currency)}
                    </TableCell>
                    <TableCell>{r.currency}</TableCell>
                    <TableCell>{formatDate(r.lastPurchaseDate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
