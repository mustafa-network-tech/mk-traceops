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
import {
  listMaterialSupplierRelations,
  listSuppliers,
} from "@/lib/data/supabase-data";

export default async function TedarikcilerPage() {
  const [suppliers, rels] = await Promise.all([
    listSuppliers(),
    listMaterialSupplierRelations(),
  ]);

  const countBySupplier = new Map<string, number>();
  for (const r of rels) {
    countBySupplier.set(
      r.supplierId,
      (countBySupplier.get(r.supplierId) ?? 0) + 1,
    );
  }

  return (
    <div>
      <PageHeader
        title="Tedarikçiler"
        description="İletişim bilgileri ve ilişkili malzeme sayısı. Detayda son fiyatlar listelenir."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Tedarikçiler" },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Yetkili</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead className="text-right">Malzeme ilişkisi</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => {
              const relCount = countBySupplier.get(s.id) ?? 0;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.contactPerson ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {s.phone ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {s.whatsapp ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs">
                    {s.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{s.city ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{relCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tedarikciler/${s.id}`}>Detay</Link>
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
