import Link from "next/link";

import { brand } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";

export default function YetkisizPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center">
      <p className="font-mono text-sm font-medium text-slate-800">{brand.name}</p>
      <h1 className="text-xl font-semibold text-slate-900">Erişim reddedildi</h1>
      <p className="max-w-md text-sm text-slate-600">
        Bu sayfayı veya modülü görüntülemek için yetkiniz yok. Fabrika yöneticinizden rol
        ataması isteyin veya doğru oturumla giriş yapın.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/kokpit">Kokpite dön</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/platform">Platform yönetimi</Link>
        </Button>
      </div>
    </div>
  );
}
