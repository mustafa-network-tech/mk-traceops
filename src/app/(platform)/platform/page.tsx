import Link from "next/link";

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
  listAllFactoryRequests,
  listFactories,
} from "@/lib/data/rbac-supabase";

export const dynamic = "force-dynamic";

export default async function PlatformHomePage() {
  const [factories, requests] = await Promise.all([
    listFactories(),
    listAllFactoryRequests(),
  ]);
  const pending = requests.filter((r) => r.status === "pending").length;
  const activeFactories = factories.filter((f) => f.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Platform özeti"
        description="Kiracı fabrikalar, talepler ve paket durumu (operasyonel üretim verisi burada gösterilmez)."
        breadcrumbs={[{ label: "Platform" }]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aktif fabrika</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeFactories}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Onay bekleyen talep</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Toplam kayıtlı fabrika</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{factories.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı işlemler</CardTitle>
          <CardDescription>Fabrika yaşam döngüsü yönetimi</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/platform/fabrika-talepleri">Onay bekleyen fabrikalar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/platform/fabrikalar">Tüm fabrikalar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
