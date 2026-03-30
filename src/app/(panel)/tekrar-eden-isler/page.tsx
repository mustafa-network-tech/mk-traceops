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
import { getRecurringPartsReport } from "@/lib/services/reportingService";

export default function TekrarEdenIslerPage() {
  const rows = getRecurringPartsReport();

  return (
    <div>
      <PageHeader
        title="Tekrar eden işler"
        description="Aynı parça kodunun birden fazla montaj grubunda geçmesi; planlama ve standartlaştırma için analitik özet."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Tekrar eden işler" },
        ]}
      />

      <Card className="mb-4 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-sm text-amber-950">Yorum</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-950">
          Tekrarlayan parçalar ortak sac kesimlerini, profil türlerini veya standart
          bağlantı elemanlarını işaret edebilir. Bu liste Excel aktarımındaki gerçek
          parça kayıtlarından türetilir.
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parça kodu</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-right">Tekrar</TableHead>
              <TableHead>Montaj grupları</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.partCode}>
                <TableCell className="font-mono text-xs font-semibold">
                  {r.partCode}
                </TableCell>
                <TableCell>{r.description}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {r.occurrenceCount}
                </TableCell>
                <TableCell className="text-sm">
                  {r.assemblyGroupCodes.join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
