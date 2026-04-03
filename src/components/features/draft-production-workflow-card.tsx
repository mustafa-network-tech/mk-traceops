"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  approveDraftProductionOrderAction,
  cancelDraftProductionOrderAction,
} from "@/app/actions/production-approval";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  orderId: string;
  orderNo: string;
};

export function DraftProductionWorkflowCard({ orderId, orderNo }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "cancel" | null>(null);

  const approve = useCallback(async () => {
    setBusy("approve");
    try {
      const r = await approveDraftProductionOrderAction(orderId);
      if (!r.ok) {
        toastActionError(r.error);
        return;
      }
      toastActionSuccess("Emir planlamaya alındı.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }, [orderId, router]);

  const cancel = useCallback(async () => {
    if (
      !window.confirm(
        `${orderNo}: Taslak emri iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      )
    ) {
      return;
    }
    setBusy("cancel");
    try {
      const r = await cancelDraftProductionOrderAction(orderId);
      if (!r.ok) {
        toastActionError(r.error);
        return;
      }
      toastActionSuccess("Taslak iptal edildi.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }, [orderId, orderNo, router]);

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="text-base">Taslak — onay gerekli</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>{orderNo}</strong> henüz <strong>taslak</strong>. Üretim çıkışı (malzeme düşümü ve
          mamul girişi) yalnızca emir <strong>planlandı</strong> durumuna alındıktan ve{" "}
          <strong>onay kaydı</strong> oluşturulduktan sonra yapılabilir.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void approve()}
          >
            {busy === "approve" ? "Onaylanıyor…" : "Planlamaya al (onay)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void cancel()}
          >
            {busy === "cancel" ? "İptal…" : "Taslağı iptal et"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
