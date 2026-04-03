import { ExcelImportSection } from "@/components/features/excel-import-section";
import { hasPermission } from "@/lib/rbac/helpers";
import { requirePanelModule } from "@/lib/rbac/require-panel-module";
import { getRbacSession } from "@/lib/rbac/session-server";

export default async function ExcelAktarimPage() {
  await requirePanelModule("excel_import", "read");
  const ctx = await getRbacSession();
  const canUpload = hasPermission(ctx, "excel_import", "create");
  const canExportBom = hasPermission(ctx, "parts_materials", "read");
  return (
    <ExcelImportSection canUpload={canUpload} canExportBom={canExportBom} />
  );
}
