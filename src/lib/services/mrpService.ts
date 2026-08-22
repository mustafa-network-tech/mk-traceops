import {
  explodePartBom,
  listMaterials,
  listParts,
  listProductionOrderLines,
  listProductionOrders,
  listProducts,
} from "@/lib/data/d1-data";
import type { Material, ProductionOrder } from "@/lib/types/models";

function normKey(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export type MrpOrderRef = {
  orderId: string;
  orderNo: string;
  quantity: number;
};

export type MrpShortageRow = {
  material: Material;
  /** Açık UE (planlandı / üretimde) için hesaplanan malzeme ihtiyacı. */
  demandFromOpenOrders: number;
  /** Mevcut stoktan sonra UE için kalan eksik (0 ise yeterli). */
  shortageAfterStock: number;
  /** Min. stok eşiğinin altında mı? */
  belowMin: boolean;
  /** Min. seviyeye çıkmak için gereken miktar (0 ise min OK). */
  shortToMin: number;
  orderRefs: MrpOrderRef[];
};

type DemandBucket = { qty: number; refs: MrpOrderRef[] };

function addDemand(
  map: Map<string, DemandBucket>,
  materialId: string,
  qty: number,
  order: ProductionOrder,
) {
  if (qty <= 0 || !Number.isFinite(qty)) return;
  let b = map.get(materialId);
  if (!b) {
    b = { qty: 0, refs: [] };
    map.set(materialId, b);
  }
  b.qty += qty;
  const ex = b.refs.find((r) => r.orderId === order.id);
  if (ex) ex.quantity += qty;
  else b.refs.push({ orderId: order.id, orderNo: order.orderNo, quantity: qty });
}

/**
 * MRP özeti: kritik min. stok + açık üretim emirleri için net malzeme riski.
 *
 * - UE satırı varsa: `quantity_used` tam emir miktarı için planlanan tüketim varsayılır;
 *   kalan üretim oranı `(planlanan - üretilen) / planlanan` ile ölçeklenir.
 * - Satır yoksa: mamul kodu/adı ile eşleşen parça + `explode_part_bom` (alt parça ağacı + malzeme patlatması; derinlik üst sınırı fabrika `bom_explosion_max_depth`).
 */
export async function computeMrpShortages(): Promise<MrpShortageRow[]> {
  const [materials, orders, allLines, products, parts] = await Promise.all([
    listMaterials(),
    listProductionOrders(),
    listProductionOrderLines(),
    listProducts(),
    listParts(),
  ]);

  const openOrders = orders.filter(
    (o) => o.status === "planlandı" || o.status === "üretimde",
  );

  const linesByOrder = new Map<string, typeof allLines>();
  for (const l of allLines) {
    const cur = linesByOrder.get(l.productionOrderId) ?? [];
    cur.push(l);
    linesByOrder.set(l.productionOrderId, cur);
  }

  const prodById = new Map(products.map((p) => [p.id, p]));
  const partByNormCode = new Map<string, (typeof parts)[0]>();
  for (const p of parts) {
    partByNormCode.set(normKey(p.partCode), p);
  }

  const demand = new Map<string, DemandBucket>();

  for (const o of openOrders) {
    const planned = Number(o.quantityPlanned);
    const produced = Number(o.quantityProduced);
    const remaining = Math.max(0, planned - produced);
    const scale =
      planned > 0 ? remaining / planned : remaining > 0 ? 1 : 0;

    const lines = linesByOrder.get(o.id) ?? [];
    if (lines.length > 0) {
      for (const line of lines) {
        addDemand(demand, line.materialId, line.quantityUsed * scale, o);
      }
      continue;
    }

    if (remaining <= 0) continue;

    const prod = prodById.get(o.productId);
    if (!prod) continue;

    const part =
      partByNormCode.get(normKey(prod.code)) ??
      partByNormCode.get(normKey(prod.name));
    if (!part) continue;

    let exploded: Awaited<ReturnType<typeof explodePartBom>>;
    try {
      exploded = await explodePartBom(part.id, remaining);
    } catch {
      continue;
    }
    for (const row of exploded) {
      addDemand(demand, row.materialId, row.quantity, o);
    }
  }

  const rows: MrpShortageRow[] = [];

  for (const m of materials) {
    if (!m.active) continue;
    const bucket = demand.get(m.id);
    const demandFromOpenOrders = bucket?.qty ?? 0;
    const shortageAfterStock = Math.max(0, demandFromOpenOrders - m.currentStock);
    const belowMin = m.currentStock <= m.minStock;
    const shortToMin = Math.max(0, m.minStock - m.currentStock);

    if (shortageAfterStock <= 0 && !belowMin) continue;

    rows.push({
      material: m,
      demandFromOpenOrders,
      shortageAfterStock,
      belowMin,
      shortToMin,
      orderRefs: bucket?.refs ?? [],
    });
  }

  rows.sort((a, b) => {
    const sa = a.shortageAfterStock + a.shortToMin;
    const sb = b.shortageAfterStock + b.shortToMin;
    if (sb !== sa) return sb - sa;
    return a.material.code.localeCompare(b.material.code, "tr");
  });

  return rows;
}
