"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteImportBatchAction } from "@/app/actions/import-batch-delete";
import {
  toastActionError,
  toastActionSuccess,
} from "@/lib/client/action-toast";
import { Button } from "@/components/ui/button";

type Props = {
  batchId: string;
  fileLabel?: string;
  /** Tanımlıysa silme sonrası bu yola gider; tanımsızsa sayfa yenilenir */
  redirectTo?: string;
  variant?: "destructive" | "outline";
  size?: "sm" | "default";
  /** false ise buton gösterilmez (excel_import güncelleme yetkisi yok) */
  canDelete?: boolean;
};

export function DeleteImportBatchButton({
  batchId,
  fileLabel,
  redirectTo,
  variant = "destructive",
  size = "sm",
  canDelete = true,
}: Props) {
  if (!canDelete) {
    return null;
  }
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const msg = fileLabel
      ? `"${fileLabel}" aktarımını, bu aktarımdan oluşan parçaları, montaj gruplarını ve yalnızca bu aktarımda oluşturulmuş (başka kayıtta kullanılmayan) malzemeleri silmek istiyor musunuz?`
      : "Bu aktarımı, ilişkili parçaları, montaj gruplarını ve yalnızca bu aktarımda oluşturulmuş (paylaşılmayan) malzemeleri silmek istiyor musunuz?";
    if (!globalThis.confirm(msg)) return;

    startTransition(async () => {
      const r = await deleteImportBatchAction(batchId);
      if (!r.ok) {
        toastActionError(r.error);
        return;
      }
      toastActionSuccess("Aktarım ve ilişkili veriler silindi.");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={onClick}
    >
      {pending ? "Siliniyor…" : "Sil"}
    </Button>
  );
}
