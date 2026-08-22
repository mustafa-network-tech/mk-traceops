"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastActionError } from "@/lib/client/action-toast";

type LoginResponse = {
  ok: boolean;
  error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const formData = new FormData(event.currentTarget);

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
            }),
          });
          const result = (await response.json()) as LoginResponse;

          if (!response.ok || !result.ok) {
            toastActionError(result.error ?? "Giriş sırasında hata oluştu.");
            return;
          }

          router.push("/kokpit");
          router.refresh();
        } catch {
          toastActionError("Giriş sırasında hata oluştu.");
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
        <Link href="/kayit" className="text-violet-700 hover:underline">
          Başvuru oluştur
        </Link>
      </p>
    </form>
  );
}
