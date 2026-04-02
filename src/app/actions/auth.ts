"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  RBAC_PROFILE_COOKIE,
  RBAC_USER_COOKIE,
} from "@/lib/rbac/session-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(RBAC_PROFILE_COOKIE);
  jar.delete(RBAC_USER_COOKIE);
  revalidatePath("/", "layout");
  redirect("/giris");
}
