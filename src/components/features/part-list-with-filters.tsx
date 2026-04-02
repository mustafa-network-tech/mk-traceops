"use client";

import { useMemo, useState } from "react";

import { MaterialTypeBadge } from "@/components/domain/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssemblyGroup, Company, Material, Part } from "@/lib/types/models";

type Row = {
  part: Part;
  material?: Material;
  company?: Company;
  assembly?: AssemblyGroup;
};

export function PartListWithFilters({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [ptype, setPtype] = useState<string>("all");

  const groupOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (r.assembly?.code) s.add(r.assembly.code);
    });
    return [...s].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (ptype !== "all" && r.part.type !== ptype) return false;
      if (group !== "all" && r.assembly?.code !== group) return false;
      if (q.trim()) {
        const t = q.toLowerCase();
        const hay = [
          r.part.partCode,
          r.part.description,
          r.part.operation,
          r.material?.name,
          r.company?.name,
          r.assembly?.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [rows, q, group, ptype]);

  return (
    <div>
      <PageHeader
        title="Ana parça listesi"
        description="Excel aktarımı sonrası parça kartları: malzeme, ölçü, operasyon, atanan firma ve montaj grubu."
        breadcrumbs={[
          { label: "Kokpit", href: "/kokpit" },
          { label: "Parça listesi" },
        ]}
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="q">Arama</Label>
          <Input
            id="q"
            placeholder="Kod, açıklama, operasyon..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Montaj grubu</Label>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {groupOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Parça tipi</Label>
          <Select value={ptype} onValueChange={setPtype}>
            <SelectTrigger>
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="ana_parça">Ana parça</SelectItem>
              <SelectItem value="alt_parça">Alt parça</SelectItem>
              <SelectItem value="montaj">Montaj</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end text-sm text-slate-600">
          {filtered.length} / {rows.length} satır
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Malzeme</TableHead>
              <TableHead>Ölçü</TableHead>
              <TableHead className="text-right">Adet</TableHead>
              <TableHead>Operasyon</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Montaj</TableHead>
              <TableHead>Tip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ part, material, company, assembly }) => (
              <TableRow key={part.id}>
                <TableCell className="font-mono text-xs">{part.partCode}</TableCell>
                <TableCell>{part.description}</TableCell>
                <TableCell className="text-sm">
                  {material ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium leading-tight">
                        {material.name}
                      </span>
                      <span className="font-mono text-xs text-slate-600">
                        {material.code}
                      </span>
                      <MaterialTypeBadge type={material.type} />
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-xs">{part.dimensions ?? "—"}</TableCell>
                <TableCell className="text-right">{part.quantity}</TableCell>
                <TableCell>{part.operation}</TableCell>
                <TableCell className="text-sm">{company?.name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {assembly?.code ?? "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {part.type.replaceAll("_", " ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
