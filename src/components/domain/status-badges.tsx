import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  ImportBatchStatus,
  ImportRowStatus,
  OperationAssignmentStatus,
  ProductionOrderStatus,
  ShipmentStatus,
} from "@/lib/types/models";

const productionLabels: Record<ProductionOrderStatus, string> = {
  taslak: "Taslak",
  planlandı: "Planlandı",
  üretimde: "Üretimde",
  tamamlandı: "Tamamlandı",
  iptal: "İptal",
};

const shipmentLabels: Record<ShipmentStatus, string> = {
  taslak: "Taslak",
  hazırlanıyor: "Hazırlanıyor",
  yola_çıktı: "Yolda",
  teslim_edildi: "Teslim",
  iptal: "İptal",
};

const importBatchLabels: Record<ImportBatchStatus, string> = {
  işleniyor: "İşleniyor",
  tamamlandı: "Tamamlandı",
  kısmi_hata: "Kısmi hata",
};

const importRowLabels: Record<ImportRowStatus, string> = {
  bekliyor: "Bekliyor",
  işlendi: "İşlendi",
  hata: "Hata",
  yok_sayıldı: "Yok sayıldı",
};

const opLabels: Record<OperationAssignmentStatus, string> = {
  beklemede: "Beklemede",
  işlemde: "İşlemde",
  tamamlandı: "Tamamlandı",
};

function pickProductionVariant(
  s: ProductionOrderStatus,
): ComponentProps<typeof Badge>["variant"] {
  if (s === "tamamlandı") return "success";
  if (s === "iptal" || s === "taslak") return "muted";
  if (s === "üretimde") return "warning";
  return "secondary";
}

function pickShipmentVariant(
  s: ShipmentStatus,
): ComponentProps<typeof Badge>["variant"] {
  if (s === "teslim_edildi") return "success";
  if (s === "iptal") return "danger";
  if (s === "yola_çıktı") return "warning";
  return "secondary";
}

export function ProductionStatusBadge({ status }: { status: ProductionOrderStatus }) {
  return (
    <Badge variant={pickProductionVariant(status)}>
      {productionLabels[status]}
    </Badge>
  );
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge variant={pickShipmentVariant(status)}>{shipmentLabels[status]}</Badge>
  );
}

export function ImportBatchStatusBadge({ status }: { status: ImportBatchStatus }) {
  const variant =
    status === "tamamlandı"
      ? "success"
      : status === "kısmi_hata"
        ? "warning"
        : "secondary";
  return <Badge variant={variant}>{importBatchLabels[status]}</Badge>;
}

export function ImportRowStatusBadge({ status }: { status: ImportRowStatus }) {
  const variant =
    status === "işlendi"
      ? "success"
      : status === "hata"
        ? "danger"
        : "muted";
  return <Badge variant={variant}>{importRowLabels[status]}</Badge>;
}

export function OperationStatusBadge({ status }: { status: OperationAssignmentStatus }) {
  const variant =
    status === "tamamlandı"
      ? "success"
      : status === "işlemde"
        ? "warning"
        : "secondary";
  return <Badge variant={variant}>{opLabels[status]}</Badge>;
}

export function MaterialTypeBadge({ type }: { type: "ham_madde" | "sarf_malzeme" }) {
  return (
    <Badge variant={type === "ham_madde" ? "secondary" : "outline"}>
      {type === "ham_madde" ? "Ham madde" : "Sarf"}
    </Badge>
  );
}

export function StockMovementTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    giriş: "Giriş",
    çıkış: "Çıkış",
    üretimde_kullanım: "Üretimde kullanım",
    iade: "İade",
    fire: "Fire",
    manuel_düzeltme: "Manuel düzeltme",
  };
  return <span className="text-sm">{map[type] ?? type}</span>;
}
