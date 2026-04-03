"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toastActionError } from "@/lib/client/action-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "").trim();
        const password = String(fd.get("password") ?? "");
        try {
          const supabase = createSupabaseBrowserClient();
          const { error: err } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (err) {
            toastActionError("E-posta veya şifre hatalı.");
            return;
          }
          router.refresh();
          router.push("/kokpit");
        } catch {
          toastActionError("Giriş sırasında bir hata oluştu.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-posta</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ornek@sirket.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Şifre</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
      <p className="text-center text-xs text-slate-600">
        Yeni fabrika mı?{" "}
        <Link href="/kayit" className="text-violet-700 underline-offset-2 hover:underline">
          Başvuru oluştur
        </Link>
      </p>
    </form>
  );
}
