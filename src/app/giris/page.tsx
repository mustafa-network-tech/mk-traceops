import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { brand } from "@/lib/constants/brand";
import { getSessionContextByProfileId } from "@/lib/data/rbac-supabase";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function GirisPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <p className="font-mono text-sm font-medium text-slate-800">{brand.name}</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Supabase ortam değişkenleri tanımlı değil. `.env.local` içinde{" "}
          <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
          <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          ekleyin.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const ctx = await getSessionContextByProfileId(user.id);
    if (ctx?.user && ctx.user.status === "active") {
      if (isPlatformAdmin(ctx.user)) {
        redirect("/platform");
      }
      redirect("/kokpit");
    }
    redirect("/basvuru-bekleniyor");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-mono text-sm font-semibold text-slate-900">{brand.name}</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Giriş</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kayıtlı e-posta ve şifrenizle panele bağlanın.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Yeni fabrika için{" "}
          <Link href="/kayit" className="text-violet-700 underline-offset-2 hover:underline">
            fabrika başvurusu
          </Link>{" "}
          yapın. Mevcut fabrikada çalışıyorsanız fabrika yöneticinizden davet isteyin.
        </p>
        <p className="mt-4 text-center text-xs">
          <Link href="/" className="text-slate-600 underline-offset-2 hover:underline">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </div>
  );
}
