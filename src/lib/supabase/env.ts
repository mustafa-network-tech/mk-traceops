/** URL + anon key yoksa false; panel verisi Supabase’ten çekilmez (çoğu liste boş kalır). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function requireSupabaseEnv(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın (.env.local).",
    );
  }
  return { url, anonKey };
}

/**
 * true ise `mk_rbac_profile_id` çerezi ile oturum seçilebilir (geliştirme / bootstrap).
 * Canlıda kapalı tutun; yalnızca Supabase Auth oturumu kullanılmalıdır.
 */
export function isRbacProfileCookieAllowed(): boolean {
  const v = process.env.RBAC_ALLOW_PROFILE_COOKIE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
