import Link from "next/link";

import { ApproveFactoryForm } from "@/components/rbac/approve-factory-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAllFactoryRequests } from "@/lib/data/rbac-supabase";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FabrikaTalepleriPage() {
  const requests = await listAllFactoryRequests();
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div>
      <PageHeader
        title="Onay bekleyen fabrikalar"
        description="Yeni fabrika kayıt talepleri. Onay sonrası ilk fabrika yöneticisi atanır ve fabrika aktifleşir."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Fabrika talepleri" },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/fabrikalar">Fabrika listesi</Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bekleyen talepler</CardTitle>
          <CardDescription>
            Platform Yöneticisi onayı olmadan fabrika kullanıma açılmaz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-slate-600">Bekleyen talep yok.</p>
          ) : (
            <div className="space-y-8">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="mb-3 text-sm">
                    <p className="font-semibold text-slate-900">{r.requestedFactoryName}</p>
                    <p className="font-mono text-xs text-slate-600">/{r.requestedSlug}</p>
                    <p className="mt-1 text-slate-600">
                      Başvuran: {r.applicantName} · {r.applicantEmail}
                    </p>
                    {r.applicantUserId ? (
                      <p className="text-xs font-medium text-violet-700">
                        Uygulama üzerinden kayıt (Auth bağlı)
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <ApproveFactoryForm
                    requestId={r.id}
                    suggestedEmail={r.applicantEmail}
                    suggestedFirstName={r.applicantFirstName ?? undefined}
                    suggestedLastName={r.applicantLastName ?? undefined}
                    lockApplicantEmail={Boolean(r.applicantUserId)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tüm talepler</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabrika</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.requestedFactoryName}</TableCell>
                  <TableCell className="font-mono text-xs">{r.requestedSlug}</TableCell>
                  <TableCell className="text-sm capitalize">{r.status}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDateTime(r.createdAt)}
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
