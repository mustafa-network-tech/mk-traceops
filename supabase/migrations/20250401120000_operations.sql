-- Operasyonel tablolar (montaj, parça, üretim, sevkiyat, stok, tedarik)
-- import_rows.linked_part_id FK parts'e bağlanır.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_number text,
  is_external_manufacturer boolean not null default false,
  contact_phone text,
  city text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  role text not null,
  department_id uuid references public.departments (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  whatsapp text,
  email text,
  city text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.material_supplier_relations (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  last_purchase_price numeric not null default 0,
  currency text not null default 'TRY',
  last_purchase_date date not null default current_date,
  is_primary boolean not null default false,
  priority_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.assembly_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  project_reference text,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (import_batch_id, code)
);

create table public.parts (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references public.import_batches (id) on delete set null,
  import_row_id uuid unique references public.import_rows (id) on delete set null,
  part_code text not null,
  description text not null default '',
  material_id uuid references public.materials (id) on delete set null,
  dimensions text,
  quantity numeric not null default 0,
  operation text not null default '',
  assigned_company_id uuid references public.companies (id) on delete set null,
  assembly_group_id uuid references public.assembly_groups (id) on delete set null,
  type text not null default 'ana_parça'
    check (type in ('ana_parça', 'alt_parça', 'montaj')),
  created_at timestamptz not null default now()
);

alter table public.import_rows
  add constraint import_rows_linked_part_id_fkey
  foreign key (linked_part_id) references public.parts (id) on delete set null;

create index parts_import_batch_id_idx on public.parts (import_batch_id);
create index parts_assembly_group_id_idx on public.parts (assembly_group_id);

create table public.operation_assignments (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts (id) on delete cascade,
  operation_name text not null,
  assigned_company_id uuid not null references public.companies (id) on delete restrict,
  planned_date date,
  status text not null default 'beklemede'
    check (status in ('beklemede', 'işlemde', 'tamamlandı')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default '',
  unit text not null default 'adet',
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create table public.product_stock_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  current_stock numeric not null default 0,
  last_production_date date,
  location_id uuid not null references public.locations (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (product_id, location_id)
);

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  product_id uuid not null references public.products (id) on delete restrict,
  assembly_group_id uuid references public.assembly_groups (id) on delete set null,
  status text not null default 'taslak'
    check (status in ('taslak', 'planlandı', 'üretimde', 'tamamlandı', 'iptal')),
  quantity_planned numeric not null default 0,
  quantity_produced numeric not null default 0,
  scheduled_date date not null,
  department_id uuid not null references public.departments (id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create table public.production_order_lines (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references public.production_orders (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete restrict,
  quantity_used numeric not null default 0,
  unit text not null default 'adet',
  note text,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete restrict,
  type text not null
    check (type in ('giriş', 'çıkış', 'üretimde_kullanım', 'iade', 'fire', 'manuel_düzeltme')),
  quantity numeric not null,
  unit text not null default 'adet',
  occurred_at timestamptz not null default now(),
  location_id uuid not null references public.locations (id) on delete restrict,
  production_order_id uuid references public.production_orders (id) on delete set null,
  assembly_group_id uuid references public.assembly_groups (id) on delete set null,
  project_reference text,
  note text,
  supplier_id uuid references public.suppliers (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_number text not null unique,
  shipped_at timestamptz not null default now(),
  recipient_name text not null,
  destination text not null,
  contact_phone text,
  contact_email text,
  status text not null default 'taslak'
    check (status in ('taslak', 'hazırlanıyor', 'yola_çıktı', 'teslim_edildi', 'iptal')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric not null default 0,
  unit text not null default 'adet',
  stock_movement_ref text,
  created_at timestamptz not null default now()
);

-- RLS (geliştirme)
alter table public.companies enable row level security;
alter table public.departments enable row level security;
alter table public.users enable row level security;
alter table public.suppliers enable row level security;
alter table public.material_supplier_relations enable row level security;
alter table public.assembly_groups enable row level security;
alter table public.parts enable row level security;
alter table public.operation_assignments enable row level security;
alter table public.products enable row level security;
alter table public.product_stock_items enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_order_lines enable row level security;
alter table public.stock_movements enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;

create policy "dev_all_companies" on public.companies for all to anon, authenticated using (true) with check (true);
create policy "dev_all_departments" on public.departments for all to anon, authenticated using (true) with check (true);
create policy "dev_all_users" on public.users for all to anon, authenticated using (true) with check (true);
create policy "dev_all_suppliers" on public.suppliers for all to anon, authenticated using (true) with check (true);
create policy "dev_all_material_supplier_relations" on public.material_supplier_relations for all to anon, authenticated using (true) with check (true);
create policy "dev_all_assembly_groups" on public.assembly_groups for all to anon, authenticated using (true) with check (true);
create policy "dev_all_parts" on public.parts for all to anon, authenticated using (true) with check (true);
create policy "dev_all_operation_assignments" on public.operation_assignments for all to anon, authenticated using (true) with check (true);
create policy "dev_all_products" on public.products for all to anon, authenticated using (true) with check (true);
create policy "dev_all_product_stock_items" on public.product_stock_items for all to anon, authenticated using (true) with check (true);
create policy "dev_all_production_orders" on public.production_orders for all to anon, authenticated using (true) with check (true);
create policy "dev_all_production_order_lines" on public.production_order_lines for all to anon, authenticated using (true) with check (true);
create policy "dev_all_stock_movements" on public.stock_movements for all to anon, authenticated using (true) with check (true);
create policy "dev_all_shipments" on public.shipments for all to anon, authenticated using (true) with check (true);
create policy "dev_all_shipment_items" on public.shipment_items for all to anon, authenticated using (true) with check (true);

-- Excel sonrası malzeme için varsayılan kategori (yoksa)
insert into public.material_categories (name, code)
select 'Genel', 'GEN'
where not exists (select 1 from public.material_categories c where c.code = 'GEN');
