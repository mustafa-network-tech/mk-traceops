import Link from "next/link";
import { notFound } from "next/navigation";

import { FactoryAdminActions } from "@/components/rbac/factory-admin-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFactoryById,
  getSubscriptionForFactory,
} from "@/lib/data/rbac-data";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const STATUS_TR: Record<string, string> = {
  pending: "Beklemede",
  active: "Aktif",
  passive: "Pasif",
  suspended: "Askıda",
};

export const dynamic = "force-dynamic";

export default async function FabrikaDetayPage({ params }: Props) {
  const { id } = await params;
  const f = await getFactoryById(id);
  if (!f) notFound();
  const sub = await getSubscriptionForFactory(f.id);

  return (
    <div>
      <PageHeader
        title={f.factoryName}
        description={`Slug: ${f.factorySlug}`}
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Fabrikalar", href: "/platform/fabrikalar" },
          { label: f.factoryName },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/fabrikalar">Listeye dön</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Erişim:</span>{" "}
              {STATUS_TR[f.status] ?? f.status}
            </p>
            <p>
              <span className="text-slate-500">Paket etiketi:</span>{" "}
              {f.packageStatus}
            </p>
            {f.approvedAt ? (
              <p className="text-xs text-slate-600">
                Onay: {formatDateTime(f.approvedAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Abonelik / deneme</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {sub ? (
              <>
                <p>Plan: {sub.planCode}</p>
                <p>Durum: {sub.status}</p>
                {sub.trialEndsAt ? (
                  <p className="text-xs text-slate-600">
                    Deneme bitiş: {formatDateTime(sub.trialEndsAt)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-slate-500">Kayıt yok (ileride Stripe vb.)</p>
            )}
          </CardContent>
        </Card>
      </div>

      <FactoryAdminActions factoryId={f.id} />
    </div>
  );
}
