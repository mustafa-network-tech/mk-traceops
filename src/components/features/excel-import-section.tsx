"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExpectedExcelColumns,
  simulateImportPreview,
  simulateImportResult,
} from "@/lib/services/importService";

export function ExcelImportSection() {
  const [preview, setPreview] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const columns = getExpectedExcelColumns();
  const rows = simulateImportPreview();

  function runSimulate() {
    setPreview(true);
    const r = simulateImportResult();
    setResultMsg(r.message);
  }

  return (
    <div>
      <PageHeader
        title="Excel aktarım"
        description="Üretim listesi ve montaj grupları için Excel şablonu. Gerçek XLS ayrıştırması ileride ImportService üzerinden bağlanacak."
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
            <div className="flex min-h-[140px] flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <p className="text-sm font-medium text-slate-700">
                Sürükleyip bırakın veya dosya seçin
              </p>
              <p className="mt-1 text-xs text-slate-500">
                .xlsx · Maks. 20 MB (simülasyon — gerçek parse yok)
              </p>
              <Button className="mt-4" variant="secondary" type="button">
                Dosya seç
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={runSimulate}>
                Önizlemeyi simüle et
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/aktarim-gecmisi">Aktarım geçmişi</a>
              </Button>
            </div>
            {resultMsg ? (
              <p className="text-sm text-emerald-800">{resultMsg}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beklenen sütunlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {columns.map((c) => (
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

      {preview ? (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>İçe aktarma önizlemesi</CardTitle>
            <Badge variant="secondary">Simülasyon</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parça kodu</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Malzeme</TableHead>
                  <TableHead>Ölçü</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Operasyon</TableHead>
                  <TableHead>Montaj grubu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.parcaKodu}</TableCell>
                    <TableCell>{r.aciklama}</TableCell>
                    <TableCell>{r.malzeme}</TableCell>
                    <TableCell>{r.olcu}</TableCell>
                    <TableCell>{r.adet}</TableCell>
                    <TableCell>{r.operasyon}</TableCell>
                    <TableCell className="font-mono text-xs">{r.montajGrubu}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
