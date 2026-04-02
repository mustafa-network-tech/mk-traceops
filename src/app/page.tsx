import { redirect } from "next/navigation";

import { getSessionContextByProfileId } from "@/lib/data/rbac-supabase";
import { isPlatformAdmin } from "@/lib/rbac/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function Home() {
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
    if (isPlatformAdmin(ctx.user)) {
      redirect("/platform");
    }
    redirect("/kokpit");
  }

  redirect("/giris");
}
