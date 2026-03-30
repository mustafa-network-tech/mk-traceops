import { AppSidebar } from "@/components/layout/app-sidebar";
import { brand } from "@/lib/constants/brand";

export function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <span className="font-mono font-medium text-slate-800">{brand.name}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">{brand.slogan}</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
