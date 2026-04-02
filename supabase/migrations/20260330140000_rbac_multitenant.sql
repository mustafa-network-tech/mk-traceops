-- MK TraceOps — çok kiracı RBAC (fabrika, talepler, profiller, davetler, izinler)
-- Demo fabrika / örnek kullanıcı EKLENMEZ; ilk platform yöneticisi Auth + SQL ile oluşturulur.

-- ---------------------------------------------------------------------------
-- Rol enum (PostgreSQL; uygulama RoleKey ile eşleşir)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum (
    'platform_admin',
    'company_admin',
    'production_user',
    'warehouse_user',
    'shipment_user',
    'viewer'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Fabrikalar
-- ---------------------------------------------------------------------------
create table public.factories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null
    check (status in ('pending', 'active', 'passive', 'suspended')),
  package_status text not null default 'none',
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index factories_status_idx on public.factories (status);

-- ---------------------------------------------------------------------------
-- Fabrika kayıt talepleri (platform onayı)
-- ---------------------------------------------------------------------------
create table public.factory_registration_requests (
  id uuid primary key default gen_random_uuid(),
  requested_factory_name text not null,
  requested_slug text not null,
  applicant_email text not null,
  applicant_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users (id) on delete set null
);

create index factory_registration_requests_status_idx
  on public.factory_registration_requests (status);

-- ---------------------------------------------------------------------------
-- Paket / abonelik (lisans durumu)
-- ---------------------------------------------------------------------------
create table public.factory_subscriptions (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories (id) on delete cascade,
  plan_code text not null default 'none',
  status text not null default 'inactive',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index factory_subscriptions_factory_id_idx
  on public.factory_subscriptions (factory_id);

-- ---------------------------------------------------------------------------
-- İzinler (modül + eylem)
-- ---------------------------------------------------------------------------
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  unique (module, action)
);

create table public.role_permissions (
  role public.app_role not null,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role, permission_id)
);

-- ---------------------------------------------------------------------------
-- Kullanıcı profili (auth.users ile 1:1)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  factory_id uuid references public.factories (id) on delete cascade,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  role public.app_role not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'pending_invite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_factory_role_ck check (
    (role = 'platform_admin' and factory_id is null)
    or (role <> 'platform_admin' and factory_id is not null)
  )
);

create index profiles_factory_id_idx on public.profiles (factory_id);
create index profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- Davetler (fabrika yöneticisi; platform_admin karışmaz)
-- ---------------------------------------------------------------------------
create table public.factory_invitations (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories (id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  role public.app_role not null,
  token text not null default encode(gen_random_bytes (24), 'hex') unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled')),
  invited_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint factory_invitations_role_ck check (role <> 'platform_admin')
);

create index factory_invitations_factory_id_idx on public.factory_invitations (factory_id);
create index factory_invitations_email_idx on public.factory_invitations (email);

-- ---------------------------------------------------------------------------
-- İzin satırları (tüm modül.eylem birleşimi)
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action) values
  ('platform_dashboard', 'read'),
  ('factories', 'read'),
  ('factories', 'create'),
  ('factories', 'update'),
  ('factories', 'approve'),
  ('factories', 'activate'),
  ('factories', 'suspend'),
  ('licenses_packages', 'read'),
  ('licenses_packages', 'create'),
  ('licenses_packages', 'update'),
  ('user_management', 'read'),
  ('user_management', 'create'),
  ('user_management', 'update'),
  ('user_management', 'delete'),
  ('user_management', 'assign_role'),
  ('company_settings', 'read'),
  ('company_settings', 'update'),
  ('invitations', 'read'),
  ('invitations', 'create'),
  ('invitations', 'update'),
  ('dashboard', 'read'),
  ('excel_import', 'read'),
  ('excel_import', 'create'),
  ('excel_import', 'update'),
  ('parts_materials', 'read'),
  ('parts_materials', 'create'),
  ('parts_materials', 'update'),
  ('parts_materials', 'delete'),
  ('assembly_groups', 'read'),
  ('assembly_groups', 'create'),
  ('assembly_groups', 'update'),
  ('assembly_groups', 'delete'),
  ('production_orders', 'read'),
  ('production_orders', 'create'),
  ('production_orders', 'update'),
  ('production_orders', 'delete'),
  ('warehouse_stock', 'read'),
  ('warehouse_stock', 'create'),
  ('warehouse_stock', 'update'),
  ('warehouse_stock', 'delete'),
  ('stock_movements', 'read'),
  ('stock_movements', 'create'),
  ('stock_movements', 'update'),
  ('shipments', 'read'),
  ('shipments', 'create'),
  ('shipments', 'update'),
  ('shipments', 'delete'),
  ('suppliers', 'read'),
  ('suppliers', 'create'),
  ('suppliers', 'update'),
  ('suppliers', 'delete'),
  ('reports', 'read')
on conflict (module, action) do nothing;

-- ---------------------------------------------------------------------------
-- Rol → izin (matris)
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role, permission_id)
select 'platform_admin', p.id from public.permissions p where (p.module, p.action) in (
  ('platform_dashboard', 'read'),
  ('factories', 'read'),
  ('factories', 'create'),
  ('factories', 'update'),
  ('factories', 'approve'),
  ('factories', 'activate'),
  ('factories', 'suspend'),
  ('licenses_packages', 'read'),
  ('licenses_packages', 'create'),
  ('licenses_packages', 'update'),
  ('user_management', 'read'),
  ('company_settings', 'read'),
  ('invitations', 'read')
);

insert into public.role_permissions (role, permission_id)
select 'company_admin', p.id from public.permissions p where (p.module, p.action) in (
  ('dashboard', 'read'),
  ('excel_import', 'read'),
  ('excel_import', 'create'),
  ('excel_import', 'update'),
  ('parts_materials', 'read'),
  ('parts_materials', 'create'),
  ('parts_materials', 'update'),
  ('parts_materials', 'delete'),
  ('assembly_groups', 'read'),
  ('assembly_groups', 'create'),
  ('assembly_groups', 'update'),
  ('assembly_groups', 'delete'),
  ('production_orders', 'read'),
  ('production_orders', 'create'),
  ('production_orders', 'update'),
  ('production_orders', 'delete'),
  ('warehouse_stock', 'read'),
  ('warehouse_stock', 'create'),
  ('warehouse_stock', 'update'),
  ('warehouse_stock', 'delete'),
  ('stock_movements', 'read'),
  ('stock_movements', 'create'),
  ('stock_movements', 'update'),
  ('shipments', 'read'),
  ('shipments', 'create'),
  ('shipments', 'update'),
  ('shipments', 'delete'),
  ('suppliers', 'read'),
  ('suppliers', 'create'),
  ('suppliers', 'update'),
  ('suppliers', 'delete'),
  ('reports', 'read'),
  ('user_management', 'read'),
  ('user_management', 'create'),
  ('user_management', 'update'),
  ('user_management', 'delete'),
  ('user_management', 'assign_role'),
  ('invitations', 'read'),
  ('invitations', 'create'),
  ('invitations', 'update'),
  ('company_settings', 'read'),
  ('company_settings', 'update')
);

insert into public.role_permissions (role, permission_id)
select 'production_user', p.id from public.permissions p where (p.module, p.action) in (
  ('dashboard', 'read'),
  ('production_orders', 'read'),
  ('production_orders', 'create'),
  ('production_orders', 'update'),
  ('parts_materials', 'read'),
  ('assembly_groups', 'read'),
  ('reports', 'read')
);

insert into public.role_permissions (role, permission_id)
select 'warehouse_user', p.id from public.permissions p where (p.module, p.action) in (
  ('dashboard', 'read'),
  ('warehouse_stock', 'read'),
  ('warehouse_stock', 'create'),
  ('warehouse_stock', 'update'),
  ('stock_movements', 'read'),
  ('stock_movements', 'create'),
  ('stock_movements', 'update'),
  ('parts_materials', 'read'),
  ('reports', 'read')
);

insert into public.role_permissions (role, permission_id)
select 'shipment_user', p.id from public.permissions p where (p.module, p.action) in (
  ('dashboard', 'read'),
  ('shipments', 'read'),
  ('shipments', 'create'),
  ('shipments', 'update'),
  ('warehouse_stock', 'read'),
  ('reports', 'read')
);

insert into public.role_permissions (role, permission_id)
select 'viewer', p.id from public.permissions p where (p.module, p.action) in (
  ('dashboard', 'read'),
  ('reports', 'read')
);

-- Profiller auth.users ile sunucu aksiyonlarında açıkça oluşturulur (rol + factory_id).

-- ---------------------------------------------------------------------------
-- RLS (geliştirme — production'da sıkılaştırın)
-- ---------------------------------------------------------------------------
alter table public.factories enable row level security;
alter table public.factory_registration_requests enable row level security;
alter table public.factory_subscriptions enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.factory_invitations enable row level security;

create policy "dev_all_factories"
  on public.factories for all to anon, authenticated using (true) with check (true);
create policy "dev_all_factory_registration_requests"
  on public.factory_registration_requests for all to anon, authenticated using (true) with check (true);
create policy "dev_all_factory_subscriptions"
  on public.factory_subscriptions for all to anon, authenticated using (true) with check (true);
create policy "dev_all_permissions"
  on public.permissions for all to anon, authenticated using (true) with check (true);
create policy "dev_all_role_permissions"
  on public.role_permissions for all to anon, authenticated using (true) with check (true);
create policy "dev_all_profiles"
  on public.profiles for all to anon, authenticated using (true) with check (true);
create policy "dev_all_factory_invitations"
  on public.factory_invitations for all to anon, authenticated using (true) with check (true);

comment on table public.factories is 'Kiracı fabrika; veri izolasyonu için operational tablolara factory_id eklenecek.';
comment on table public.profiles is 'auth.users ile eşleşen uygulama profili ve rol.';
comment on table public.permissions is 'RBAC izin satırları; role_permissions ile rollere bağlanır.';

-- ---------------------------------------------------------------------------
-- İlk Platform Yöneticisi (manuel — demo fabrika EKLEMEYİN)
-- 1) Supabase Dashboard → Authentication → Add user (e-posta onaylı).
-- 2) Aşağıdaki id değerini o kullanıcının auth.users.id UUID’si ile değiştirin.
-- 3) SQL Editor’de çalıştırın:
--
-- insert into public.profiles (id, email, first_name, last_name, role, status, factory_id)
-- values (
--   '00000000-0000-0000-0000-000000000000',
--   'platform@sirketiniz.com',
--   'Platform',
--   'Yöneticisi',
--   'platform_admin',
--   'active',
--   null
-- );
--
-- Fabrika kayıt talebi örneği (isteğe bağlı):
-- insert into public.factory_registration_requests
--   (requested_factory_name, requested_slug, applicant_email, applicant_name, status)
-- values ('Yeni Fabrika A.Ş.', 'yeni-fabrika', 'basvuru@firma.com', 'Başvuran Ad', 'pending');
-- ---------------------------------------------------------------------------
