import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/health/supabase — Yerel .env.local ile Supabase erişimini test eder.
 * Anahtarları yanıtta döndürmez.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        ok: false,
        message:
          "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local içinde tanımlı değil.",
      },
      { status: 200 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("material_categories")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          configured: true,
          ok: false,
          message:
            error.message ??
            "Sorgu başarısız. Migration çalıştırıldı mı? (material_categories tablosu)",
          code: error.code,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      configured: true,
      ok: true,
      message:
        "Supabase bağlantısı ve material_categories sorgusu başarılı.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        message: msg,
      },
      { status: 200 },
    );
  }
}
