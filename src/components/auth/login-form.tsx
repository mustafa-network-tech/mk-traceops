"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
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
            setError("E-posta veya şifre hatalı.");
            return;
          }
          router.refresh();
          router.push("/kokpit");
        } catch {
          setError("Giriş sırasında bir hata oluştu.");
        } finally {
          setPending(false);
        }
      }}
    >
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
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
    </form>
  );
}
