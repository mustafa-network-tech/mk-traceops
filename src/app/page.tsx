import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/landing-page";
import { getSessionContextByProfileId } from "@/lib/data/rbac-supabase";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MK TraceOps — Tanıtım",
  description:
    "MK TraceOps: üretimden sevkiyata tek panelde operasyon. Kayıt ve onay sonrası kendi fabrikanızla kullanın.",
};

export default async function Home() {
  if (!isSupabaseConfigured()) {
    redirect("/giris");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const ctx = await getSessionContextByProfileId(user.id);
  if (ctx?.user && ctx.user.status === "active") {
    if (isPlatformAdmin(ctx.user)) {
      redirect("/platform");
    }
    redirect("/kokpit");
  }

  redirect("/basvuru-bekleniyor");
}
