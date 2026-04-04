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
  getSubscriptionForFactory,
  listFactories,
} from "@/lib/data/rbac-supabase";
import { formatDateTime } from "@/lib/format";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

const STATUS_TR: Record<string, string> = {
  pending: "Beklemede",
  active: "Aktif",
  passive: "Pasif",
  suspended: "Askıda",
};

export const dynamic = "force-dynamic";

export default async function FabrikalarPage() {
  const factories = await listFactories();
  const rows = await Promise.all(
    factories.map(async (f) => ({
      factory: f,
      sub: await getSubscriptionForFactory(f.id),
    })),
  );

  return (
    <div>
      <PageHeader
        title="Fabrikalar"
        description="Tüm kiracılar. Paket ve erişim durumu buradan yönetilir."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Fabrikalar" },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/fabrika-talepleri">Talepler</Link>
          </Button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Abonelik</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Kayıtlı fabrika yok veya liste yüklenemedi.</p>
                  <p className="mt-2 max-w-xl">
                    Veritabanında <code className="rounded bg-slate-100 px-1 text-xs">factories</code>{" "}
                    satırı yoksa önce fabrika onayı / kayıt akışını tamamlayın. Liste RLS veya oturum
                    yüzünden boşsa, dağıtım ortamında sunucu env&apos;ine{" "}
                    <code className="rounded bg-slate-100 px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                    ekleyin (platform okumaları böylece RLS&apos;yi aşar).
                    {!isSupabaseAdminConfigured() ? (
                      <span className="mt-1 block text-amber-800">
                        Şu an service role anahtarı tanımlı görünmüyor.
                      </span>
                    ) : null}
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map(({ factory: f, sub }) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.factoryName}</TableCell>
                <TableCell className="font-mono text-xs">{f.factorySlug}</TableCell>
                <TableCell className="text-sm">
                  {STATUS_TR[f.status] ?? f.status}
                </TableCell>
                <TableCell className="text-sm">{f.packageStatus}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  {sub
                    ? `${sub.planCode} · ${sub.status}${
                        sub.trialEndsAt
                          ? ` · deneme ${formatDateTime(sub.trialEndsAt)}`
                          : ""
                      }`
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/platform/fabrikalar/${f.id}`}>Yönet</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
