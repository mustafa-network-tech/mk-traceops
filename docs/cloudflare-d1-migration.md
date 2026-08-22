# Supabase/PostgreSQL → Cloudflare D1 geçiş envanteri

`supabase/migrations` geri dönüş ve veri taşıma referansı olarak korunur. Yeni şema `d1/migrations` altındadır.

## PostgreSQL karşılıkları

| PostgreSQL / Supabase | D1 / SQLite |
|---|---|
| `uuid`, `gen_random_uuid()` | Worker `crypto.randomUUID()`, `TEXT PRIMARY KEY` |
| `app_role enum` | `TEXT CHECK (...)` |
| `jsonb` | `TEXT CHECK(json_valid(...))`; uygulamada JSON parse/stringify |
| `timestamptz`, `now()` | UTC ISO-8601 `TEXT`; Worker üretir |
| `boolean` | `INTEGER CHECK(value IN (0,1))` |
| `numeric` | `REAL`; finansal kesinlik gerekirse ölçekli `INTEGER` kullanılmalı |
| PL/pgSQL RPC / `SECURITY DEFINER` | Parametreli repository/service metotları ve `D1Database.batch()` |
| RLS, `auth.uid()` | Doğrulanmış oturumdan `TenantContext`; her operasyonel sorguda zorunlu `factory_id` |
| recursive CTE | SQLite `WITH RECURSIVE` (BOM) |
| partial/index/unique | SQLite index ve birleşik `UNIQUE(factory_id, ...)` |
| trigger | Döngü engeli SQLite trigger; iş kuralları servis katmanında |

## Supabase Auth envanteri ve ayrıştırma kararı

Runtime auth D1 `auth_credentials` tablosu, Workers Web Crypto PBKDF2 doğrulaması ve `httpOnly` profil oturum çerezi ile çalışır. Eski Supabase Auth istemcileri, middleware ve ortam değişkenleri runtime’dan kaldırılmıştır.

Supabase Storage kullanımı tespit edilmedi. PostgreSQL array/serial/identity kullanımı tespit edilmedi.

## Taşınması gereken RPC'ler

`delete_import_batch_cascade`, `apply_stock_movement`, `approve_production_order`, `cancel_draft_production_order`, `record_production_output`, `create_draft_production_order`, `explode_part_bom`, `fill_production_order_lines_from_bom`, `rbac_my_factory_id`, `rbac_is_platform_admin`. BOM ve stok için D1 repository karşılıkları başlatıldı; kalan iş akışları D1 etkinleştirilmeden önce servis katmanına alınmalıdır.
