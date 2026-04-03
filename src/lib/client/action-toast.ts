"use client";

import { toast } from "sonner";

const UNIQUE_RE = /duplicate key|unique constraint|23505/i;

/** Sunucu aksiyonundan gelen ham hata metnini gösterir; yaygın DB mesajlarını sadeleştirir. */
export function toastActionError(message: string) {
  const raw = (message || "").trim() || "İşlem başarısız.";
  const display = UNIQUE_RE.test(raw)
    ? "Bu kayıt çakışıyor (benzersiz kısıt)."
    : raw;
  toast.error(display, { duration: 7000 });
}

export function toastActionSuccess(message: string) {
  toast.success(message);
}
