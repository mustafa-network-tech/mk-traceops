import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/constants/brand";
export default function BasvuruBekleniyorPage(){return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="w-full max-w-lg rounded-xl border bg-white p-8 shadow-sm"><p className="font-mono text-sm font-semibold">{brand.name}</p><h1 className="mt-2 text-xl font-semibold">Başvuru alındı</h1><p className="mt-4 text-sm text-slate-600">Fabrika başvurunuz D1 üzerinde kaydedildi. Platform yöneticisi onayladıktan sonra aynı e-posta ve şifreyle giriş yapabilirsiniz.</p><div className="mt-8"><Button variant="outline" size="sm" asChild><Link href="/giris">Giriş sayfası</Link></Button></div></div></div>}
