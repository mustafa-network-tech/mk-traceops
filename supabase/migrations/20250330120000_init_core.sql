-- mk-traceops — çekirdek tablolar (malzeme, lokasyon, import izi)
-- Supabase SQL Editor veya CLI ile uygulayın.
-- UYARI: Aşağıdaki RLS politikaları geliştirme içindir; canlıda auth ve dar kurallarla değiştirin.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Malzeme
-- ---------------------------------------------------------------------------
create table public.material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('ham_madde', 'sarf_malzeme')),
  unit text not null,
  min_stock numeric not null default 0,
  current_stock numeric not null default 0,
  active boolean not null default true,
  category_id uuid not null references public.material_categories (id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materials_category_id_idx on public.materials (category_id);

-- ---------------------------------------------------------------------------
-- Lokasyon
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  type text not null check (type in ('depo', 'üretim_hattı', 'sevk_bekleme')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Excel / import (staging)
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  uploaded_by_user_id uuid references auth.users (id) on delete set null,
  row_count int not null default 0,
  success_count int not null default 0,
  error_count int not null default 0,
  status text not null check (status in ('işleniyor', 'tamamlandı', 'kısmi_hata')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  row_index int not null,
  raw_data jsonb not null default '{}'::jsonb,
  status text not null check (status in ('bekliyor', 'işlendi', 'hata', 'yok_sayıldı')),
  message text,
  linked_part_id uuid,
  created_at timestamptz not null default now(),
  unique (batch_id, row_index)
);

create index import_rows_batch_id_idx on public.import_rows (batch_id);

-- ---------------------------------------------------------------------------
-- RLS (geliştirme — herkese açık; production’da kaldırın)
-- ---------------------------------------------------------------------------
alter table public.material_categories enable row level security;
alter table public.materials enable row level security;
alter table public.locations enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

create policy "dev_all_material_categories"
  on public.material_categories
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "dev_all_materials"
  on public.materials
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "dev_all_locations"
  on public.locations
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "dev_all_import_batches"
  on public.import_batches
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "dev_all_import_rows"
  on public.import_rows
  for all
  to anon, authenticated
  using (true)
  with check (true);
