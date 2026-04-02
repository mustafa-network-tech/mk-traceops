import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MK TraceOps nedir?",
  description:
    "Excel’den sevkiyata: MK TraceOps operasyon sisteminin veri akışı ve modülleri.",
};

const sections: { title: string; paragraphs: string[] }[] = [
  {
    title: "Giriş",
    paragraphs: [
      "MK TraceOps, fabrikadaki malzeme ve üretim sürecini tek panelden takip etmek için tasarlanmış bir operasyon sistemidir. Amaç, dağınık Excel ve sahadaki bilgiyi aynı yerde, izlenebilir ve güncel tutmaktır. Aşağıda süreç, verinin yolculuğu üzerinden özetlenmektedir.",
    ],
  },
  {
    title: "Excel ile veriyi sisteme almak",
    paragraphs: [
      "Üretimde kullanılan parça listeleri, malzeme bilgileri ve çoğu zaman ham madde tanımları Excel (.xlsx) dosyalarıyla sisteme aktarılır. Dosya, sistemin beklediği sütun başlıklarına göre okunur; satırlar tek tek işlenir.",
      "Doğru ve eksiksiz satırlar kayda alınır ve üretimle ilişkilendirilmeye hazır hale gelir. Eksik veya hatalı satırlar işaretlenir; hangi satırda neyin düzeltilmesi gerektiği görülebilir. Böylece her aktarım bir kayıt olarak durur ve geriye dönük izlenebilir.",
    ],
  },
  {
    title: "Listelerin işlenmesi: parça, malzeme, rota",
    paragraphs: [
      "Aktarılan veri, üretim diline çevrilir: parçalar ve ürün yapısı (kodlar, açıklamalar, gruplar) sistemde yapılandırılır; malzemeler (ham madde, sarf vb.) tanımlanır veya mevcut kayıtlarla eşleştirilir. Rota ve operasyon bilgisi varsa, parçanın üretim adımlarıyla ilişkisi kurulur. Özetle Excel’deki liste mantığı, üretilebilir ve stoklanabilir bir modele dönüşür.",
    ],
  },
  {
    title: "Tedarik ve şirket tarafı",
    paragraphs: [
      "Sistemde tedarikçiler ve gerektiğinde şirket veya dış üretici gibi iş ortakları tanımlanabilir. Malzemelerle tedarikçi ilişkisi kurulduğunda “bu malzeme kimden geliyor” sorusu tek ekranda yanıtlanabilir. Bu kısım, sonraki aşamalarda iş atama ve planlama ile birleşir.",
    ],
  },
  {
    title: "Üretim emirleri ve saha takibi",
    paragraphs: [
      "Üretim kararı verildiğinde üretim emirleri açılır; miktar, ilgili parça ve bağlam netleşir. İş atamaları ile belirli operasyonlar şirketlere veya süreçlere bağlanabilir; montaj ve grup takibi ile üretim grupları ve ilerleme izlenebilir. Amaç, emrin hangi aşamada olduğu ve kime iş düştüğü sorularına panel üzerinden cevap verebilmektir.",
    ],
  },
  {
    title: "Stok, depo ve mamul",
    paragraphs: [
      "Üretim ve hareketlerle birlikte stok anlam kazanır. Lokasyon ve depo mantığıyla malzeme ve mamul nerede tutuluyor görülebilir. Stok hareketleri giriş, çıkış ve düzeltmeleri izlenebilir kılar; mamul stoku üretilen ürünün depodaki durumunu özetler. Excel’de dağınık olan “ne kadar var, nerede” bilgisi tek çatı altında toplanır.",
    ],
  },
  {
    title: "Sevkiyat ve raporlama",
    paragraphs: [
      "Hazır ürün veya sevk edilecek kalemler sevkiyat sürecine alınır; planlanan veya gerçekleşen çıkışlar kayıt altına alınır. Üretim ve stokla uyumlu bir kapanış halkası oluşur: malzemenin yolculuğu üretimden çıkıp depodan müşteriye kadar izlenebilir.",
      "Aynı veri tabanından beslenen raporlama ekranları operasyonun özetini verir; aktarım, üretim, stok ve sevkiyat zinciri tek sistemde birbirine bağlı kalır.",
    ],
  },
];

const closing =
  "MK TraceOps, Excel’de başlayan fabrika verisini düzenli kayıtlara dönüştürür; üretimi, stoğu ve sevkiyatı aynı panelde birbirine bağlayarak malzemenin fabrikadaki yolculuğunu görünür kılar.";

export default function MkTraceopsNedirPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
          >
            ← Ana sayfa
          </Link>
          <Link
            href="/giris"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-lg bg-violet-600 text-white shadow-sm hover:bg-violet-700",
            )}
          >
            Giriş Yap
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          MK TraceOps nedir?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Excel’den sevkiyata tek akış — sistem özeti
        </p>

        <div className="mt-10 space-y-12">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-4 space-y-3 text-pretty text-base leading-relaxed text-slate-600">
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 border-t border-slate-200 pt-10 text-pretty text-base font-medium leading-relaxed text-slate-800">
          {closing}
        </p>

        <footer className="mt-12 border-t border-slate-200 pt-8 text-sm text-slate-600">
          <p className="font-medium text-slate-800">MK Digital Systems</p>
        </footer>
      </main>
    </div>
  );
}
