import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productRepository } from "@/lib/repositories";

export default function UrunKartlariPage() {
  const products = productRepository.getAll();

  return (
    <div>
      <PageHeader
        title="Ürün kartları"
        description="Mamul tanımları: kod, ad, kategori, birim ve durum. Stok ve sevkiyat bu kartlara bağlanır."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Ürün kartları" },
        ]}
      />

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Örnek mamul formu (salt okunur alanlar — V1 mock)
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Ürün kodu</Label>
            <Input readOnly value="MML-…" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Ad</Label>
            <Input readOnly value="…" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Input readOnly value="…" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <Label>Birim</Label>
            <Input readOnly value="adet" className="bg-slate-50" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Not</Label>
            <Textarea readOnly className="bg-slate-50" value="" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mamul listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Birim</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Not</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {p.code}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "success" : "muted"}>
                      {p.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-600">
                    {p.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
