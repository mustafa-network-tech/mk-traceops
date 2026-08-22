import "server-only";
import { createId, getDatabase, nowIso } from "@/lib/d1/database";

type ImportRow = { id: string; raw_data: string };
function text(row: Record<string, unknown>, ...keys: string[]): string { for (const key of keys) { const value = String(row[key] ?? "").trim(); if (value) return value; } return ""; }
function number(row: Record<string, unknown>, ...keys: string[]): number { const value = Number(text(row, ...keys).replace(",", ".")); return Number.isFinite(value) ? value : 0; }

/** Excel satırlarını tenant-korumalı D1 kartlarına dönüştüren uygulama katmanı. */
export async function syncPartsFromImportBatch(batchId: string, factoryId: string): Promise<void> {
  const db = getDatabase(); const now = nowIso();
  const batch = await db.prepare("SELECT id FROM import_batches WHERE id=? AND factory_id=?").bind(batchId, factoryId).first();
  if (!batch) throw new Error("Aktarım bu fabrikaya ait değil.");
  const rows = await db.prepare("SELECT id,raw_data FROM import_rows WHERE batch_id=? ORDER BY row_index").bind(batchId).all<ImportRow>();
  let category = await db.prepare("SELECT id FROM material_categories WHERE factory_id=? AND code='EXCEL'").bind(factoryId).first<{ id: string }>();
  if (!category) { const id=createId(); await db.prepare("INSERT INTO material_categories (id,factory_id,name,code,created_at) VALUES (?,?,'Excel Aktarımı','EXCEL',?)").bind(id,factoryId,now).run(); category={id}; }
  for (const source of rows.results) {
    const raw=JSON.parse(source.raw_data) as Record<string,unknown>; const kind=text(raw,"_excel_row_kind");
    const code=text(raw,"KODU","Parça Kodu","Ham Madde Kodu"); if(!code){await db.prepare("UPDATE import_rows SET status='hata',message='Kod bulunamadı' WHERE id=?").bind(source.id).run();continue;}
    try {
      if(kind==="ham_madde"){const existing=await db.prepare("SELECT id FROM materials WHERE factory_id=? AND code=?").bind(factoryId,code).first();if(!existing)await db.prepare("INSERT INTO materials (id,factory_id,code,name,type,unit,min_stock,current_stock,active,category_id,source_import_batch_id,created_at,updated_at) VALUES (?,?,?,?, 'ham_madde',?,?,?,?,?,?,?,?)").bind(createId(),factoryId,code,text(raw,"Ham Madde Adı","AÇIKLAMA")||code,text(raw,"Birim","BİRİM")||"adet",number(raw,"Min Stok","MIN STOK"),number(raw,"Mevcut Stok","STOK MİKTARI"),1,category.id,batchId,now,now).run();await db.prepare("UPDATE import_rows SET status='işlendi' WHERE id=?").bind(source.id).run();continue;}
      const groupCode=text(raw,"GRUP","Montaj Grubu");let groupId:string|null=null;if(groupCode){const hit=await db.prepare("SELECT id FROM assembly_groups WHERE factory_id=? AND import_batch_id=? AND code=?").bind(factoryId,batchId,groupCode).first<{id:string}>();groupId=hit?.id??createId();if(!hit)await db.prepare("INSERT INTO assembly_groups (id,factory_id,code,name,import_batch_id,created_at) VALUES (?,?,?,?,?,?)").bind(groupId,factoryId,groupCode,groupCode,batchId,now).run();}
      const existing=await db.prepare("SELECT id FROM parts WHERE factory_id=? AND part_code=? ORDER BY created_at DESC LIMIT 1").bind(factoryId,code).first<{id:string}>();const partId=existing?.id??createId();if(!existing)await db.prepare("INSERT INTO parts (id,factory_id,import_batch_id,import_row_id,part_code,description,dimensions,quantity,operation,assembly_group_id,type,created_at) VALUES (?,?,?,?,?,?,?,?,?,?, 'ana_parça',?)").bind(partId,factoryId,batchId,source.id,code,text(raw,"AÇIKLAMA","Açıklama"),text(raw,"HAMMADDE ÖLÇÜSÜ","Ölçü")||null,number(raw,"ADET","Adet"),text(raw,"ROTA","Operasyon"),groupId,now).run();await db.prepare("UPDATE import_rows SET status='işlendi',linked_part_id=? WHERE id=?").bind(partId,source.id).run();
    } catch(error){await db.prepare("UPDATE import_rows SET status='hata',message=? WHERE id=?").bind(error instanceof Error?error.message:"Satır işlenemedi.",source.id).run();}
  }
  const counts=await db.prepare("SELECT SUM(CASE WHEN status='işlendi' THEN 1 ELSE 0 END) success_count,SUM(CASE WHEN status='hata' THEN 1 ELSE 0 END) error_count FROM import_rows WHERE batch_id=?").bind(batchId).first<{success_count:number;error_count:number}>();await db.prepare("UPDATE import_batches SET success_count=?,error_count=?,status=? WHERE id=? AND factory_id=?").bind(counts?.success_count??0,counts?.error_count??0,(counts?.error_count??0)>0?"kısmi_hata":"tamamlandı",batchId,factoryId).run();
}
