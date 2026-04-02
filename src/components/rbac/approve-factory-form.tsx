"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  approveFactoryRequestAction,
  rejectFactoryRequestAction,
} from "@/app/actions/platform-factories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApproveFactoryForm({
  requestId,
  suggestedEmail,
  suggestedFirstName,
  suggestedLastName,
  lockApplicantEmail,
}: {
  requestId: string;
  suggestedEmail?: string;
  suggestedFirstName?: string;
  suggestedLastName?: string;
  /** Kendi kayıt olan başvuruda e-posta başvuru ile aynı kalmalı */
  lockApplicantEmail?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-md border border-white bg-white p-4 shadow-sm sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await approveFactoryRequestAction({
            requestId,
            firstAdminEmail: String(fd.get("email") ?? ""),
            firstAdminFirstName: String(fd.get("firstName") ?? ""),
            firstAdminLastName: String(fd.get("lastName") ?? ""),
            firstAdminPhone: String(fd.get("phone") ?? "") || undefined,
            packageStatus: String(fd.get("packageStatus") ?? "trial") || "trial",
          });
          if (!r.ok) {
            globalThis.alert(r.error);
            return;
          }
          globalThis.alert(
            lockApplicantEmail
              ? "Fabrika onaylandı. Başvuran kullanıcı fabrika yöneticisi olarak atandı."
              : "Fabrika onaylandı ve ilk yönetici oluşturuldu.",
          );
          router.refresh();
        });
      }}
    >
      <p className="sm:col-span-2 text-xs font-medium text-slate-700">
        İlk fabrika yöneticisi
        {lockApplicantEmail ? (
          <span className="ml-1 font-normal text-slate-500">
            (kayıtlı başvuru — e-posta başvuru ile aynı olmalı)
          </span>
        ) : null}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={`email-${requestId}`}>E-posta</Label>
        <Input
          id={`email-${requestId}`}
          name="email"
          type="email"
          required
          placeholder="yonetici@firma.com"
          defaultValue={suggestedEmail ?? ""}
          readOnly={Boolean(lockApplicantEmail)}
          className={lockApplicantEmail ? "bg-slate-50" : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`phone-${requestId}`}>Telefon</Label>
        <Input id={`phone-${requestId}`} name="phone" placeholder="Opsiyonel" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`fn-${requestId}`}>Ad</Label>
        <Input
          id={`fn-${requestId}`}
          name="firstName"
          required
          defaultValue={suggestedFirstName ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`ln-${requestId}`}>Soyad</Label>
        <Input
          id={`ln-${requestId}`}
          name="lastName"
          required
          defaultValue={suggestedLastName ?? ""}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`pkg-${requestId}`}>Paket / lisans etiketi</Label>
        <Input
          id={`pkg-${requestId}`}
          name="packageStatus"
          defaultValue="trial"
          placeholder="trial, active, enterprise..."
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Onaylanıyor…"
            : lockApplicantEmail
              ? "Onayla ve fabrikayı aç"
              : "Onayla ve yöneticiyi oluştur"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const r = await rejectFactoryRequestAction(requestId);
              if (!r.ok) {
                globalThis.alert(r.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          Reddet
        </Button>
      </div>
    </form>
  );
}
