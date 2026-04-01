"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { uploadExcelImportAction } from "@/app/actions/excel-import";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXCEL_MAX_BYTES } from "@/lib/services/excelParse";
import {
  getExpectedExcelColumns,
  getExpectedHamMaddeExcelColumns,
  getExpectedListeExcelColumns,
} from "@/lib/services/importService";

export function ExcelImportSection() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const columnsListe = getExpectedListeExcelColumns();
  const columnsAna = getExpectedExcelColumns();
  const columnsHam = getExpectedHamMaddeExcelColumns();

  const sendFile = useCallback(
    async (file: File) => {
      setError(null);
      const name = file.name.toLowerCase();
      if (!name.endsWith(".xlsx")) {
        setError("Yalnızca .xlsx dosyaları kabul edilir.");
        return;
      }
      if (file.size > EXCEL_MAX_BYTES) {
        setError("Dosya boyutu 20 MB sınırını aşıyor.");
        return;
      }

      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadExcelImportAction(fd);
        if (result.ok) {
          router.push(`/aktarim-gecmisi/${result.batchId}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void sendFile(f);
      e.target.value = "";
    },
    [sendFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void sendFile(f);
    },
    [sendFile],
  );

  return (
    <div>
      <PageHeader
        title="Excel aktarım"
        description="Birincil format: Excel’deki LİSTE başlıkları (KODU, GRUP, HAMMADDE, ROTA…). Sistem bu isimlere göre okur ve kaydeder; tüm sütunlar aktarım kaydında kalır. Formüller: kayıtlı hesaplanmış değer. İsteğe bağlı ham madde sayfası. Geçmiş dosyalar için eski «Parça Kodu» şablonu yedeklenir."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Excel aktarım" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dosya yükleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              name="file"
              onChange={onInputChange}
              disabled={busy}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !busy && inputRef.current?.click()}
              className={
                "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 text-center transition-colors " +
                (dragOver
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-300 bg-slate-50")
              }
            >
              <p className="text-sm font-medium text-slate-700">
                Sürükleyip bırakın veya tıklayın
              </p>
              <p className="mt-1 text-xs text-slate-500">
                .xlsx · En fazla 20 MB
              </p>
              <Button
                className="mt-4 pointer-events-none"
                variant="secondary"
                type="button"
                disabled={busy}
              >
                {busy ? "Yükleniyor…" : "Dosya seç"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild disabled={busy}>
                <Link href="/aktarim-gecmisi">Aktarım geçmişi</Link>
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Birincil: Excel LİSTE başlıkları (KODU, GRUP, …)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto text-sm">
                {columnsListe.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-col rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-slate-800">{c.key}</span>
                    <span className="text-slate-600">{c.aciklama}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Eski şablon — Sayfa 1 ana parçalar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {columnsAna.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-col rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-slate-800">{c.key}</span>
                    <span className="text-slate-600">{c.aciklama}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ham maddeler — ayrı sayfa (opsiyonel)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {columnsHam.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-col rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-slate-800">{c.key}</span>
                    <span className="text-slate-600">{c.aciklama}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
