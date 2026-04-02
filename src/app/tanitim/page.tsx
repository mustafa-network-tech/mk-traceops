import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "MK TraceOps — Tanıtım",
  description:
    "MK TraceOps: üretimden sevkiyata tek panelde operasyon. Kayıt ve onay sonrası kendi fabrikanızla kullanın.",
};

/** Oturum açıkken de görülebilir tanıtım (paneldeki “Ana sayfa” bağlantısı). */
export default function TanitimPage() {
  return <LandingPage />;
}
