import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/d1/database";
import { AuthRepository } from "@/lib/d1/repositories/auth";
import {
  RBAC_PROFILE_COOKIE,
  RBAC_USER_COOKIE,
} from "@/lib/rbac/session-server";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as LoginBody;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || email.length > 254 || !password || password.length > 1024) {
      return NextResponse.json(
        { ok: false, error: "E-posta veya şifre hatalı." },
        { status: 400 },
      );
    }

    const profileId = await new AuthRepository(getDatabase()).authenticate(
      email,
      password,
    );

    if (!profileId) {
      return NextResponse.json(
        { ok: false, error: "E-posta veya şifre hatalı." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(RBAC_PROFILE_COOKIE, profileId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    response.cookies.delete(RBAC_USER_COOKIE);
    return response;
  } catch (error) {
    console.error("Login request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { ok: false, error: "Giriş sırasında sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
