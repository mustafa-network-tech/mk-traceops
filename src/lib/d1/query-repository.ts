import "server-only";

import type { Database } from "./database";

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type Filter = { column: string; operator: "=" | "IN"; value: unknown };

const TABLES = new Set([
  "assembly_groups", "companies", "departments", "locations", "material_categories",
  "material_supplier_relations", "materials", "operation_assignments", "part_child_parts",
  "part_material_requirements", "part_route_steps", "parts", "product_stock_items", "products",
  "production_order_lines", "production_orders", "shipment_items", "shipments", "stock_movements",
  "suppliers", "users", "factories", "profiles", "factory_registration_requests",
  "factory_subscriptions", "factory_invitations", "permissions", "role_permissions",
  "import_batches", "import_rows",
]);

function identifier(value: string): string {
  if (!/^[a-z][a-z0-9_]*$/i.test(value)) throw new Error("Geçersiz SQL tanımlayıcısı.");
  return `"${value}"`;
}

export class D1ReadRepository {
  constructor(private readonly db: Database, private readonly factoryId?: string) {}
  from(table: string): D1SelectBuilder {
    if (!TABLES.has(table)) throw new Error(`D1 tablosuna erişim izni yok: ${table}`);
    return new D1SelectBuilder(this.db, table, this.factoryId);
  }
}

export class D1SelectBuilder implements PromiseLike<QueryResult<any>> {
  private filters: Filter[] = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private offset?: number;
  private rowLimit?: number;
  private single = false;

  constructor(private readonly db: Database, private readonly table: string, private readonly factoryId?: string) {}
  select(columns: string): this {
    if (!columns.trim()) throw new Error("D1 kolon seçimi boş olamaz.");
    return this;
  }
  eq(column: string, value: unknown): this { this.filters.push({ column, operator: "=", value }); return this; }
  in(column: string, values: unknown[]): this { this.filters.push({ column, operator: "IN", value: values }); return this; }
  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending !== false }); return this;
  }
  range(from: number, to: number): this { this.offset = from; this.rowLimit = Math.max(0, to - from + 1); return this; }
  limit(value: number): this { this.rowLimit = Math.max(0, value); return this; }
  maybeSingle(): this { this.single = true; this.rowLimit = 1; return this; }

  async execute(): Promise<QueryResult<Record<string, unknown>[] | Record<string, unknown>>> {
    try {
      const clauses: string[] = [];
      const bindings: unknown[] = [];
      for (const filter of this.filters) {
        const column = identifier(filter.column);
        if (filter.operator === "=") { clauses.push(`${column} = ?`); bindings.push(filter.value); }
        else {
          const values = filter.value as unknown[];
          if (!values.length) return { data: this.single ? null : [], error: null };
          clauses.push(`${column} IN (${values.map(() => "?").join(",")})`); bindings.push(...values);
        }
      }
      if (this.factoryId) {
        const direct = new Set(["assembly_groups","companies","departments","locations","material_categories","material_supplier_relations","materials","parts","products","production_orders","shipments","stock_movements","suppliers","users","import_batches"]);
        const ownership: Record<string, string> = {
          product_stock_items: "EXISTS (SELECT 1 FROM products owner WHERE owner.id=product_stock_items.product_id AND owner.factory_id=?)",
          production_order_lines: "EXISTS (SELECT 1 FROM production_orders owner WHERE owner.id=production_order_lines.production_order_id AND owner.factory_id=?)",
          shipment_items: "EXISTS (SELECT 1 FROM shipments owner WHERE owner.id=shipment_items.shipment_id AND owner.factory_id=?)",
          part_child_parts: "EXISTS (SELECT 1 FROM parts owner WHERE owner.id=part_child_parts.parent_part_id AND owner.factory_id=?)",
          part_material_requirements: "EXISTS (SELECT 1 FROM parts owner WHERE owner.id=part_material_requirements.part_id AND owner.factory_id=?)",
          part_route_steps: "EXISTS (SELECT 1 FROM parts owner WHERE owner.id=part_route_steps.part_id AND owner.factory_id=?)",
          operation_assignments: "EXISTS (SELECT 1 FROM parts owner WHERE owner.id=operation_assignments.part_id AND owner.factory_id=?)",
          import_rows: "EXISTS (SELECT 1 FROM import_batches owner WHERE owner.id=import_rows.batch_id AND owner.factory_id=?)",
        };
        if (direct.has(this.table)) { clauses.push(`${identifier(this.table)}.factory_id = ?`); bindings.push(this.factoryId); }
        else if (ownership[this.table]) { clauses.push(ownership[this.table]); bindings.push(this.factoryId); }
        else throw new Error(`Tenant sahipliği tanımlanmamış tablo: ${this.table}`);
      }
      let sql = `SELECT * FROM ${identifier(this.table)}`;
      if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
      if (this.orders.length) sql += ` ORDER BY ${this.orders.map((item) => `${identifier(item.column)} ${item.ascending ? "ASC" : "DESC"}`).join(", ")}`;
      if (this.rowLimit !== undefined) {
        sql += " LIMIT ?"; bindings.push(this.rowLimit);
        if (this.offset !== undefined) { sql += " OFFSET ?"; bindings.push(this.offset); }
      }
      if (this.single) return { data: await this.db.prepare(sql).bind(...bindings).first<Record<string, unknown>>(), error: null };
      const result = await this.db.prepare(sql).bind(...bindings).all<Record<string, unknown>>();
      return { data: result.results, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "D1 sorgusu başarısız." } };
    }
  }
  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled as never, onrejected); }
}
