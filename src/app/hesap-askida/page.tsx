import Link from "next/link";

import { brand } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";

export default function HesapAskidaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-50 p-6 text-center">
      <p className="font-mono text-sm font-medium text-slate-800">{brand.name}</p>
      <h1 className="text-xl font-semibold text-amber-950">Hesap askıda veya pasif</h1>
      <p className="max-w-md text-sm text-amber-900/90">
        Fabrika erişiminiz platform yöneticisi tarafından askıya alınmış veya pasifleştirilmiş
        olabilir. Ödeme / lisans yenilemesi için yöneticinizle veya satış ekibimizle iletişime
        geçin.
      </p>
      <Button variant="outline" asChild>
        <Link href="/platform">Platform yönetimi (yöneticiler)</Link>
      </Button>
    </div>
  );
}
