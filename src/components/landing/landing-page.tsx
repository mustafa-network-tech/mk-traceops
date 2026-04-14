import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Truck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tanıtım sayfasındaki giriş / kayıt CTA’ları harici uygulamaya gider. */
const EXTERNAL_APP_URL = "https://mustafaoner.net";

const systemCards = [
  {
    icon: FileSpreadsheet,
    title: "Düzenli veri",
    text: "Excel’den gelen verileri yapılandırılmış, izlenebilir kayıtlara dönüştürür.",
  },
  {
    icon: Factory,
    title: "Üretim takibi",
    text: "Üretim süreçlerini ve emirleri tek akışta takip eder; malzeme hareketleriyle bağlar.",
  },
  {
    icon: Boxes,
    title: "Stok ve depo",
    text: "Malzeme ve stok hareketlerini yönetir; depo akışını kontrol altında tutar.",
  },
  {
    icon: Truck,
    title: "Sevkiyat ve görünürlük",
    text: "Sevkiyat sürecini izler; tüm operasyonu tek panelde görünür kılar.",
  },
];

const moduleCards = [
  {
    icon: Factory,
    title: "Üretim Yönetimi",
    text: "Üretim emirleri, iş atamaları ve montaj takibi.",
  },
  {
    icon: Package,
    title: "Depo ve Stok",
    text: "Stok hareketleri, mamul stoku ve depo operasyonları.",
  },
  {
    icon: Truck,
    title: "Sevkiyat Takibi",
    text: "Sevkiyat planı ve çıkış süreçlerinin izlenmesi.",
  },
  {
    icon: Boxes,
    title: "Malzeme ve Tedarik",
    text: "Malzeme kartları, tedarikçiler ve tedarik ilişkileri.",
  },
  {
    icon: BarChart3,
    title: "Raporlama",
    text: "Operasyonel verilerin özetlenmesi ve raporlanması.",
  },
];

function PrimaryCta({ className }: { className?: string }) {
  return (
    <a
      href={EXTERNAL_APP_URL}
      className={cn(
        buttonVariants({ size: "lg" }),
        "rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20 hover:bg-violet-700",
        className,
      )}
    >
      Sisteme Giriş Yap
    </a>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 font-mono text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
          >
            MK TraceOps
          </Link>
          <nav
            className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm text-slate-600 sm:gap-x-6"
            aria-label="Üst menü"
          >
            <a href="#top" className="hover:text-slate-900">
              Ana Sayfa
            </a>
            <a href="#sistem" className="hover:text-slate-900">
              Sistem
            </a>
            <a href="#moduller" className="hover:text-slate-900">
              Modüller
            </a>
            <a href="#baslangic" className="hover:text-slate-900">
              Başlangıç
            </a>
            <Link
              href="/mk-traceops-nedir"
              className="hover:text-slate-900"
            >
              MK TraceOps nedir
            </Link>
            <a
              href={EXTERNAL_APP_URL}
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-lg bg-violet-600 px-4 text-white shadow-sm hover:bg-violet-700",
              )}
            >
              Giriş Yap
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section
          id="top"
          className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-violet-50/40 px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgb(139 92 246 / 0.12), transparent 45%),
                radial-gradient(circle at 80% 60%, rgb(100 116 139 / 0.08), transparent 40%)`,
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="font-mono text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              MK TraceOps
            </h1>
            <p className="mt-3 text-lg font-medium text-violet-700 sm:text-xl">
              Malzemenin üretimdeki yolculuğu
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              MK TraceOps, üretimden sevkiyata kadar tüm süreci tek panelde izlenebilir hale getiren
              web tabanlı bir operasyon sistemidir.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <PrimaryCta />
              <a
                href={EXTERNAL_APP_URL}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-xl border-slate-300 bg-white/80 text-slate-800 hover:bg-white",
                )}
              >
                Paneli İncele
              </a>
            </div>
          </div>
        </section>

        <section
          id="sistem"
          className="scroll-mt-20 border-b border-slate-200/60 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Sistem Ne Yapar?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Excel’den gelen verileri düzenler; üretim, stok, depo ve sevkiyatı bir arada yönetir.
            </p>
            <ul className="sr-only">
              <li>Excel’den gelen verileri düzenli hale getirir</li>
              <li>Üretim süreçlerini takip eder</li>
              <li>Malzeme ve stok hareketlerini yönetir</li>
              <li>Depo ve sevkiyat akışını kontrol eder</li>
              <li>Tüm süreci tek panelde görünür hale getirir</li>
            </ul>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {systemCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <card.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="moduller"
          className="scroll-mt-20 border-b border-slate-200/60 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Modüller
                </h2>
                <p className="mt-2 max-w-xl text-slate-600">
                  Operasyonel ihtiyaçlara göre yapılandırılmış modüller.
                </p>
              </div>
              <LayoutDashboard
                className="hidden h-10 w-10 shrink-0 text-violet-200 sm:block"
                aria-hidden
              />
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moduleCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <card.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="baslangic"
          className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Sisteme Nasıl Başlanır?
            </h2>
            <p className="mt-4 text-pretty text-slate-600">
              Kendi e-postanızla kayıt olun, fabrika talebinizi oluşturun. Platform yöneticisi
              onayından sonra panele giriş yaparak üretim, depo, sevkiyat ve diğer modülleri
              kendi verilerinizle kullanabilirsiniz.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href={EXTERNAL_APP_URL}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-xl border-violet-300 bg-white/90 text-slate-900 hover:bg-white",
                )}
              >
                Kayıt ol
              </a>
              <PrimaryCta />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono font-semibold text-slate-900">MK TraceOps</p>
            <p className="mt-2 text-sm text-slate-500">© 2026 MK TraceOps</p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-800">MK Digital Systems</p>
            <p className="mt-1">Mustafa Öner</p>
            <a
              href="mailto:mustafa82oner@gmail.com"
              className="mt-1 inline-block text-violet-700 underline-offset-2 hover:underline"
            >
              mustafa82oner@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
