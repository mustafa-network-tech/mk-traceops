"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteImportBatchAction } from "@/app/actions/import-batch-delete";
import { Button } from "@/components/ui/button";

type Props = {
  batchId: string;
  fileLabel?: string;
  /** Tanımlıysa silme sonrası bu yola gider; tanımsızsa sayfa yenilenir */
  redirectTo?: string;
  variant?: "destructive" | "outline";
  size?: "sm" | "default";
};

export function DeleteImportBatchButton({
  batchId,
  fileLabel,
  redirectTo,
  variant = "destructive",
  size = "sm",
}: Props) {
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
        globalThis.alert(r.error);
        return;
      }
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
