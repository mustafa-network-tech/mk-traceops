-- mk-traceops — operasyonel tablolarda çok kiracı: factory_id + kiracı RLS
-- Önkoşul: 20260330140000_rbac_multitenant (factories, profiles) uygulanmış olmalı.
--
-- Mevcut operasyonel satır varken hiç fabrika yoksa migration durur (açıklayıcı hata).
-- Fabrika varken: eski satırlar ilk aktif (yoksa herhangi bir) fabrikaya atanır.

-- ---------------------------------------------------------------------------
-- Oturum yardımcıları (profiles üzerinden; SECURITY DEFINER, RLS bypass)
-- ---------------------------------------------------------------------------
create or replace function public.rbac_my_factory_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.factory_id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.rbac_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'platform_admin'::public.app_role
      and p.status = 'active'
  );
$$;

comment on function public.rbac_my_factory_id() is
  'JWT oturumundaki kullanıcının profiles.factory_id; fabrika kullanıcıları için dolu.';
comment on function public.rbac_is_platform_admin() is
  'Platform yöneticisi tam erişim (operasyonel RLS bypass).';

grant execute on function public.rbac_my_factory_id() to authenticated, anon;
grant execute on function public.rbac_is_platform_admin() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- factory_id kolonları (önce nullable)
-- ---------------------------------------------------------------------------
alter table public.material_categories
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.materials
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.locations
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.import_batches
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.companies
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.departments
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.users
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.suppliers
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.assembly_groups
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.parts
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.products
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.production_orders
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.stock_movements
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

alter table public.shipments
  add column if not exists factory_id uuid references public.factories (id) on delete restrict;

-- ---------------------------------------------------------------------------
-- Geri doldurma + benzersizlik (fabrika + kod)
-- ---------------------------------------------------------------------------
do $$
declare
  fid uuid;
  has_factory boolean;
  has_ops boolean;
begin
  select exists (select 1 from public.factories limit 1) into has_factory;

  -- LIMIT ile UNION ALL aynı ifadede PG'de sözdizimi hatasına yol açar; OR + EXISTS kullan.
  has_ops :=
    exists (select 1 from public.materials limit 1)
    or exists (select 1 from public.material_categories limit 1)
    or exists (select 1 from public.parts limit 1);

  if has_ops and not has_factory then
    raise exception
      'Operasyonel veri (materials / material_categories / parts) var ama public.factories boş. Önce en az bir fabrika oluşturun, sonra bu migration''ı tekrar çalıştırın.';
  end if;

  if not has_factory then
    raise notice 'mk-traceops: factories tablosu boş — factory_id nullable kalır; RLS yine uygulanır.';
    return;
  end if;

  select f.id into fid
  from public.factories f
  where f.status = 'active'
  order by f.created_at
  limit 1;

  if fid is null then
    select f.id into fid
    from public.factories f
    order by f.created_at
    limit 1;
  end if;

  update public.material_categories set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.materials set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.locations set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.import_batches set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.companies set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.departments set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.users set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.suppliers set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.assembly_groups set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.parts set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.products set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.production_orders set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.stock_movements set factory_id = coalesce(factory_id, fid) where factory_id is null;
  update public.shipments set factory_id = coalesce(factory_id, fid) where factory_id is null;
end $$;

-- Eski global unique → (factory_id, kod); NOT NULL — yalnızca en az bir fabrika varken
do $$
begin
  if not exists (select 1 from public.factories limit 1) then
    raise notice 'mk-traceops: benzersizlik ve NOT NULL atlandı (henüz fabrika yok).';
    return;
  end if;

  alter table public.material_categories drop constraint if exists material_categories_code_key;
  alter table public.material_categories
    add constraint material_categories_factory_code_key unique (factory_id, code);

  alter table public.materials drop constraint if exists materials_code_key;
  alter table public.materials
    add constraint materials_factory_code_key unique (factory_id, code);

  alter table public.locations drop constraint if exists locations_code_key;
  alter table public.locations
    add constraint locations_factory_code_key unique (factory_id, code);

  alter table public.departments drop constraint if exists departments_code_key;
  alter table public.departments
    add constraint departments_factory_code_key unique (factory_id, code);

  alter table public.products drop constraint if exists products_code_key;
  alter table public.products
    add constraint products_factory_code_key unique (factory_id, code);

  alter table public.production_orders drop constraint if exists production_orders_order_no_key;
  alter table public.production_orders
    add constraint production_orders_factory_order_no_key unique (factory_id, order_no);

  alter table public.shipments drop constraint if exists shipments_shipment_number_key;
  alter table public.shipments
    add constraint shipments_factory_shipment_number_key unique (factory_id, shipment_number);

  alter table public.material_categories alter column factory_id set not null;
  alter table public.materials alter column factory_id set not null;
  alter table public.locations alter column factory_id set not null;
  alter table public.import_batches alter column factory_id set not null;
  alter table public.companies alter column factory_id set not null;
  alter table public.departments alter column factory_id set not null;
  alter table public.users alter column factory_id set not null;
  alter table public.suppliers alter column factory_id set not null;
  alter table public.assembly_groups alter column factory_id set not null;
  alter table public.parts alter column factory_id set not null;
  alter table public.products alter column factory_id set not null;
  alter table public.production_orders alter column factory_id set not null;
  alter table public.stock_movements alter column factory_id set not null;
  alter table public.shipments alter column factory_id set not null;
end $$;

create index if not exists material_categories_factory_id_idx on public.material_categories (factory_id);
create index if not exists materials_factory_id_idx on public.materials (factory_id);
create index if not exists locations_factory_id_idx on public.locations (factory_id);
create index if not exists import_batches_factory_id_idx on public.import_batches (factory_id);
create index if not exists companies_factory_id_idx on public.companies (factory_id);
create index if not exists departments_factory_id_idx on public.departments (factory_id);
create index if not exists users_factory_id_idx on public.users (factory_id);
create index if not exists suppliers_factory_id_idx on public.suppliers (factory_id);
create index if not exists assembly_groups_factory_id_idx on public.assembly_groups (factory_id);
create index if not exists parts_factory_id_idx on public.parts (factory_id);
create index if not exists products_factory_id_idx on public.products (factory_id);
create index if not exists production_orders_factory_id_idx on public.production_orders (factory_id);
create index if not exists stock_movements_factory_id_idx on public.stock_movements (factory_id);
create index if not exists shipments_factory_id_idx on public.shipments (factory_id);

-- ---------------------------------------------------------------------------
-- Eski geliştirme politikalarını kaldır
-- ---------------------------------------------------------------------------
drop policy if exists "dev_all_material_categories" on public.material_categories;
drop policy if exists "dev_all_materials" on public.materials;
drop policy if exists "dev_all_locations" on public.locations;
drop policy if exists "dev_all_import_batches" on public.import_batches;
drop policy if exists "dev_all_import_rows" on public.import_rows;
drop policy if exists "dev_all_companies" on public.companies;
drop policy if exists "dev_all_departments" on public.departments;
drop policy if exists "dev_all_users" on public.users;
drop policy if exists "dev_all_suppliers" on public.suppliers;
drop policy if exists "dev_all_material_supplier_relations" on public.material_supplier_relations;
drop policy if exists "dev_all_assembly_groups" on public.assembly_groups;
drop policy if exists "dev_all_parts" on public.parts;
drop policy if exists "dev_all_operation_assignments" on public.operation_assignments;
drop policy if exists "dev_all_products" on public.products;
drop policy if exists "dev_all_product_stock_items" on public.product_stock_items;
drop policy if exists "dev_all_production_orders" on public.production_orders;
drop policy if exists "dev_all_production_order_lines" on public.production_order_lines;
drop policy if exists "dev_all_stock_movements" on public.stock_movements;
drop policy if exists "dev_all_shipments" on public.shipments;
drop policy if exists "dev_all_shipment_items" on public.shipment_items;
drop policy if exists "dev_all_part_material_requirements" on public.part_material_requirements;
drop policy if exists "dev_all_part_route_steps" on public.part_route_steps;

-- ---------------------------------------------------------------------------
-- Kiracı RLS: doğrudan factory_id taşıyan tablolar
-- ---------------------------------------------------------------------------
create policy "material_categories_tenant"
  on public.material_categories
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "materials_tenant"
  on public.materials
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "locations_tenant"
  on public.locations
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "import_batches_tenant"
  on public.import_batches
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "companies_tenant"
  on public.companies
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "departments_tenant"
  on public.departments
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "users_legacy_tenant"
  on public.users
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "suppliers_tenant"
  on public.suppliers
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "assembly_groups_tenant"
  on public.assembly_groups
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "parts_tenant"
  on public.parts
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "products_tenant"
  on public.products
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "production_orders_tenant"
  on public.production_orders
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "stock_movements_tenant"
  on public.stock_movements
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

create policy "shipments_tenant"
  on public.shipments
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  )
  with check (
    public.rbac_is_platform_admin()
    or factory_id = public.rbac_my_factory_id()
  );

-- ---------------------------------------------------------------------------
-- İlişkili tablolar (üst kayıt üzerinden)
-- ---------------------------------------------------------------------------
create policy "import_rows_tenant"
  on public.import_rows
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.import_batches b
      where b.id = import_rows.batch_id
        and b.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.import_batches b
      where b.id = import_rows.batch_id
        and b.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "material_supplier_relations_tenant"
  on public.material_supplier_relations
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.materials m
      where m.id = material_supplier_relations.material_id
        and m.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.materials m
      where m.id = material_supplier_relations.material_id
        and m.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "operation_assignments_tenant"
  on public.operation_assignments
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = operation_assignments.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = operation_assignments.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "part_material_requirements_tenant"
  on public.part_material_requirements
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = part_material_requirements.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = part_material_requirements.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "part_route_steps_tenant"
  on public.part_route_steps
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = part_route_steps.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts p
      where p.id = part_route_steps.part_id
        and p.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "production_order_lines_tenant"
  on public.production_order_lines
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.production_orders o
      where o.id = production_order_lines.production_order_id
        and o.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.production_orders o
      where o.id = production_order_lines.production_order_id
        and o.factory_id = public.rbac_my_factory_id()
    )
  );

create policy "product_stock_items_tenant"
  on public.product_stock_items
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or (
      exists (
        select 1
        from public.products pr
        where pr.id = product_stock_items.product_id
          and pr.factory_id = public.rbac_my_factory_id()
      )
      and exists (
        select 1
        from public.locations l
        where l.id = product_stock_items.location_id
          and l.factory_id = public.rbac_my_factory_id()
      )
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or (
      exists (
        select 1
        from public.products pr
        where pr.id = product_stock_items.product_id
          and pr.factory_id = public.rbac_my_factory_id()
      )
      and exists (
        select 1
        from public.locations l
        where l.id = product_stock_items.location_id
          and l.factory_id = public.rbac_my_factory_id()
      )
    )
  );

create policy "shipment_items_tenant"
  on public.shipment_items
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.shipments s
      where s.id = shipment_items.shipment_id
        and s.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.shipments s
      where s.id = shipment_items.shipment_id
        and s.factory_id = public.rbac_my_factory_id()
    )
  );

-- Oturumsuz sağlık kontrolü (yalnızca kategori okuma; anon anahtar)
create policy "material_categories_anon_health_select"
  on public.material_categories
  for select
  to anon
  using (true);
