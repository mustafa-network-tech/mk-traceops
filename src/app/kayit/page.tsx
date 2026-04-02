import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterFactoryForm } from "@/components/auth/register-factory-form";
import { brand } from "@/lib/constants/brand";
import { getSessionContextByProfileId } from "@/lib/data/rbac-supabase";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ eposta?: string }> };

export default async function KayitPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <p className="font-mono text-sm font-medium text-slate-800">{brand.name}</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Supabase ortam değişkenleri tanımlı değil.
        </p>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  const emailVerify = sp.eposta === "dogrula";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const ctx = await getSessionContextByProfileId(user.id);
    if (ctx?.user && ctx.user.status === "active") {
      if (isPlatformAdmin(ctx.user)) redirect("/platform");
      redirect("/kokpit");
    }
    redirect("/basvuru-bekleniyor");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-mono text-sm font-semibold text-slate-900">{brand.name}</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Fabrika başvurusu</h1>
        <p className="mt-1 text-sm text-slate-600">
          Hesabınızı oluşturun; platform yöneticisi fabrika ve fabrika yöneticiliğinizi onayladığında
          panele giriş yaparsınız. Diğer çalışanlar fabrika yöneticisinin davetiyle eklenir.
        </p>
        {emailVerify ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            E-posta doğrulama bağlantısına tıklayın. Doğruladıktan sonra{" "}
            <Link href="/giris" className="font-medium underline underline-offset-2">
              giriş
            </Link>{" "}
            yaparak başvuru durumunuzu takip edebilirsiniz.
          </p>
        ) : null}
        <div className="mt-6">
          <RegisterFactoryForm />
        </div>
      </div>
    </div>
  );
}
