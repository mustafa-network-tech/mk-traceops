"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { uploadExcelImportAction } from "@/app/actions/excel-import";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXCEL_MAX_BYTES } from "@/lib/services/excelParse";
import {
  getExpectedHamMaddeExcelColumns,
  getExpectedListeExcelColumns,
  getExpectedPartLinkExcelColumns,
} from "@/lib/services/importService";

export function ExcelImportSection({
  canUpload = true,
  canExportBom = false,
}: {
  canUpload?: boolean;
  canExportBom?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const columnsListe = getExpectedListeExcelColumns();
  const columnsHam = getExpectedHamMaddeExcelColumns();
  const columnsPartLink = getExpectedPartLinkExcelColumns();

  const sendFile = useCallback(
    async (file: File) => {
      if (!canUpload) return;
      const name = file.name.toLowerCase();
      if (!name.endsWith(".xlsx")) {
        toastActionError("Yalnızca .xlsx dosyaları kabul edilir.");
        return;
      }
      if (file.size > EXCEL_MAX_BYTES) {
        toastActionError("Dosya boyutu 20 MB sınırını aşıyor.");
        return;
      }

      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadExcelImportAction(fd);
        if (result.ok) {
          toastActionSuccess("Aktarım kaydedildi.");
          router.push(`/aktarim-gecmisi/${result.batchId}`);
          router.refresh();
        } else {
          toastActionError(result.error);
        }
      } finally {
        setBusy(false);
      }
    },
    [router, canUpload],
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
        description="LİSTE (KODU, GRUP, HAMMADDE, ROTA…, isteğe bağlı ÜST_PARÇA_KODU / ÜST_BAŞINA), isteğe bağlı ham madde sayfası ve ayrıca LİSTE dışında üçüncü bir sayfada «Parça bağlantıları» (ÜST_KODU, ALT_KODU) tanımlanabilir. Formüller hesaplanmış değer olarak okunur. «BOM dışa aktar» dosyasında BOM_AYARLAR sayfasında patlatma derinliği ve açıklamalar; PARCA_BAGLANTI / PARCA_MALZEME veri sayfalarıdır. Derinlik üst sınırı Ayarlar’da değiştirilir."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Excel aktarım" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dosya yükleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpload ? (
              <>
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
              </>
            ) : (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                Bu hesap için yeni Excel yüklemek üzere <strong>oluşturma</strong> yetkisi tanımlı
                değil. Mevcut aktarımları{" "}
                <Link href="/aktarim-gecmisi" className="font-medium underline underline-offset-2">
                  geçmiş
                </Link>{" "}
                üzerinden görüntüleyebilirsiniz.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild disabled={busy}>
                <Link href="/aktarim-gecmisi">Aktarım geçmişi</Link>
              </Button>
              {canExportBom ? (
                <Button type="button" variant="outline" asChild disabled={busy}>
                  <a href="/api/export/factory-bom">BOM dışa aktar (.xlsx)</a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LİSTE — sütunlar</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Parça bağlantıları — ayrı sayfa (opsiyonel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                LİSTE ve ham madde sayfaları dışında kalan bir çalışma sayfasında yalnızca aşağıdaki
                başlıklar olmalıdır; bu sayfada <strong>KODU</strong> sütunu olmamalıdır (LİSTE ile
                karışmasın). Satırlar <code className="rounded bg-slate-100 px-1">part_child_parts</code>{" "}
                olarak aktarılır.
              </p>
              <ul className="max-h-[min(40vh,280px)] space-y-2 overflow-y-auto">
                {columnsPartLink.map((c) => (
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
