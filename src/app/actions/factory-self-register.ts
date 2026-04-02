"use server";

import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isValidFactorySlug,
  normalizeFactorySlug,
} from "@/lib/services/factory-slug";

export type FactorySelfRegisterResult =
  | { ok: true; needsEmailConfirm?: boolean }
  | { ok: false; error: string };

async function assertSlugAvailable(slug: string): Promise<FactorySelfRegisterResult> {
  if (isSupabaseAdminConfigured()) {
    const adm = createSupabaseAdminClient();
    const { data: facHit } = await adm
      .from("factories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (facHit) {
      return { ok: false, error: "Bu fabrika kodu (slug) zaten kullanılıyor." };
    }
    const { data: pendHit } = await adm
      .from("factory_registration_requests")
      .select("id")
      .eq("requested_slug", slug)
      .eq("status", "pending")
      .maybeSingle();
    if (pendHit) {
      return {
        ok: false,
        error: "Bu fabrika kodu için zaten bekleyen bir başvuru var.",
      };
    }
    return { ok: true };
  }

  const c = await createSupabaseServerClient();
  const { data: facHit } = await c
    .from("factories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (facHit) {
    return { ok: false, error: "Bu fabrika kodu (slug) zaten kullanılıyor." };
  }
  return { ok: true };
}

async function rollbackAuthUser(userId: string) {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const adm = createSupabaseAdminClient();
    await adm.auth.admin.deleteUser(userId);
  } catch {
    /* yut */
  }
}

export async function registerFactoryApplicantAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  factoryName: string;
  factorySlugRaw: string;
}): Promise<FactorySelfRegisterResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase yapılandırılmamış." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const factoryName = input.factoryName.trim();
  const slug = normalizeFactorySlug(input.factorySlugRaw);

  if (!firstName || !lastName) {
    return { ok: false, error: "Ad ve soyad zorunludur." };
  }
  if (!email || !password) {
    return { ok: false, error: "E-posta ve şifre zorunludur." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Şifre en az 8 karakter olmalıdır." };
  }
  if (!factoryName) {
    return { ok: false, error: "Fabrika adı zorunludur." };
  }
  if (!isValidFactorySlug(slug)) {
    return {
      ok: false,
      error:
        "Fabrika kodu 2–48 karakter olmalı; yalnızca küçük harf, rakam ve tire (ör. benim-fabrika).",
    };
  }

  const slugOk = await assertSlugAvailable(slug);
  if (!slugOk.ok) return slugOk;

  const supabase = await createSupabaseServerClient();
  const { data: signData, error: signErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (signErr) {
    const msg = signErr.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        ok: false,
        error: "Bu e-posta ile zaten bir hesap var. Giriş yapın veya şifre sıfırlayın.",
      };
    }
    return { ok: false, error: signErr.message };
  }

  const userId = signData.user?.id;
  if (!userId) {
    return {
      ok: false,
      error:
        "Hesap oluşturulamadı. E-posta doğrulaması açıksa postayı onaylayıp tekrar deneyin.",
    };
  }

  const applicantName = `${firstName} ${lastName}`.trim();
  const row = {
    requested_factory_name: factoryName,
    requested_slug: slug,
    applicant_email: email,
    applicant_name: applicantName,
    applicant_first_name: firstName,
    applicant_last_name: lastName,
    applicant_user_id: userId,
    status: "pending" as const,
  };

  let insertError = (await supabase.from("factory_registration_requests").insert(row))
    .error;

  if (insertError && !signData.session && isSupabaseAdminConfigured()) {
    const adm = createSupabaseAdminClient();
    insertError = (await adm.from("factory_registration_requests").insert(row)).error;
  }

  if (insertError) {
    await rollbackAuthUser(userId);
    if (insertError.code === "23505") {
      return {
        ok: false,
        error:
          "Bu e-posta veya fabrika kodu için zaten bekleyen bir başvuru var; veya kod çakışıyor.",
      };
    }
    return {
      ok: false,
      error: `${insertError.message} Başvuru kaydı oluşturulamadı.`,
    };
  }

  // Supabase projede "Confirm email" açık olsa bile: service role ile e-postayı onayla
  // ve oturum yoksa aynı istekte şifreyle giriş yap (başvuru sayfasına yönlendirme çalışsın).
  let sessionEstablished = Boolean(signData.session);
  if (isSupabaseAdminConfigured()) {
    try {
      const adm = createSupabaseAdminClient();
      const { error: confirmErr } = await adm.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (!confirmErr && !sessionEstablished) {
        const { data: signInData, error: signInErr } =
          await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr && signInData.session) {
          sessionEstablished = true;
        }
      }
    } catch {
      /* Service role veya oturum hatası: Supabase “confirm email” ayarına göre eski akış */
    }
  }

  return {
    ok: true,
    needsEmailConfirm: !sessionEstablished,
  };
}
