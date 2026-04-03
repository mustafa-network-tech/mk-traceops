"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerFactoryApplicantAction } from "@/app/actions/factory-self-register";
import { toastActionError } from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeFactorySlug } from "@/lib/services/factory-slug";

export function RegisterFactoryForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [slugPreview, setSlugPreview] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const fd = new FormData(e.currentTarget);
        try {
          const r = await registerFactoryApplicantAction({
            firstName: String(fd.get("firstName") ?? ""),
            lastName: String(fd.get("lastName") ?? ""),
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
            factoryName: String(fd.get("factoryName") ?? ""),
            factorySlugRaw: String(fd.get("factorySlug") ?? ""),
          });
          if (!r.ok) {
            toastActionError(r.error);
            return;
          }
          if (r.needsEmailConfirm) {
            router.push("/kayit?eposta=dogrula");
            return;
          }
          router.refresh();
          router.push("/basvuru-bekleniyor");
        } catch {
          toastActionError("Kayıt sırasında bir hata oluştu.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-fn">Ad</Label>
          <Input id="reg-fn" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-ln">Soyad</Label>
          <Input id="reg-ln" name="lastName" autoComplete="family-name" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">E-posta</Label>
        <Input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="yonetici@firma.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-pw">Şifre</Label>
        <Input
          id="reg-pw"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-slate-500">En az 8 karakter.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-factory">Fabrika adı</Label>
        <Input
          id="reg-factory"
          name="factoryName"
          required
          placeholder="Örnek Metal A.Ş."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-slug">Fabrika kodu (URL)</Label>
        <Input
          id="reg-slug"
          name="factorySlug"
          required
          placeholder="ornek-metal"
          pattern="[a-z0-9]+([a-z0-9-]*[a-z0-9]+)?"
          onChange={(ev) => setSlugPreview(normalizeFactorySlug(ev.target.value))}
        />
        <p className="text-xs text-slate-500">
          Küçük harf, rakam ve tire. Önizleme:{" "}
          <span className="font-mono text-slate-700">{slugPreview || "—"}</span>
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Hesap oluştur ve başvur"}
      </Button>
      <p className="text-center text-xs text-slate-600">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-violet-700 underline-offset-2 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
