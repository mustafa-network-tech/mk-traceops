import Link from "next/link";
import { redirect } from "next/navigation";

import { brand } from "@/lib/constants/brand";
import {
  getLatestFactoryRequestForAuthUser,
  getSessionContextByProfileId,
} from "@/lib/data/rbac-supabase";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BasvuruBekleniyorPage() {
  if (!isSupabaseConfigured()) {
    redirect("/giris");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const ctx = await getSessionContextByProfileId(user.id);
  if (ctx?.user && ctx.user.status === "active") {
    if (isPlatformAdmin(ctx.user)) redirect("/platform");
    redirect("/kokpit");
  }

  const latest = await getLatestFactoryRequestForAuthUser(user.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-mono text-sm font-semibold text-slate-900">{brand.name}</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Başvuru durumu</h1>

        {!latest ? (
          <p className="mt-4 text-sm text-slate-600">
            Hesabınız için fabrika başvurusu bulunamadı. Profil atanmamış bir Auth hesabınız olabilir.
            Platform yöneticinize danışın veya yeni başvuru için{" "}
            <Link href="/kayit" className="text-violet-700 underline-offset-2 hover:underline">
              kayıt
            </Link>{" "}
            sayfasını kullanın.
          </p>
        ) : latest.status === "pending" ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-900">Fabrika:</span>{" "}
              {latest.requestedFactoryName}
            </p>
            <p>
              <span className="font-medium text-slate-900">Kod:</span>{" "}
              <span className="font-mono text-xs">{latest.requestedSlug}</span>
            </p>
            <p>
              <span className="font-medium text-slate-900">Başvuran:</span>{" "}
              {latest.applicantName} · {latest.applicantEmail}
            </p>
            <p className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">
              Başvurunuz platform yöneticisi onayını bekliyor. Onaylandığında aynı e-posta ve
              şifrenizle giriş yaparak fabrika paneline erişebilirsiniz.
            </p>
          </div>
        ) : latest.status === "rejected" ? (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p className="rounded-md bg-red-50 px-3 py-2 text-red-800">
              Son başvurunuz reddedildi. Detay için platform yöneticinize yazın.
            </p>
            <p>
              Fabrika: {latest.requestedFactoryName} ({latest.requestedSlug})
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Son kaydınız onaylanmış görünüyor; profil yükleniyorsa sayfayı yenileyin veya{" "}
            <Link href="/giris" className="text-violet-700 underline-offset-2 hover:underline">
              giriş
            </Link>{" "}
            yapın.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/giris">Giriş sayfası</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Ana sayfa</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
