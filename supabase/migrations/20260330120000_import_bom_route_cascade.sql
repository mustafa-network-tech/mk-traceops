-- LİSTE aktarımı: parça–malzeme ihtiyaç (BOM satırı), rota adımları,
-- batch ile oluşturulan malzemelerin izi ve aktarım silmede tutarlı temizlik.

-- ---------------------------------------------------------------------------
-- Malzeme: hangi import batch ile ilk kez oluşturuldu (silmede güvenli temizlik)
-- ---------------------------------------------------------------------------
alter table public.materials
  add column if not exists source_import_batch_id uuid
  references public.import_batches (id) on delete set null;

create index if not exists materials_source_import_batch_id_idx
  on public.materials (source_import_batch_id)
  where source_import_batch_id is not null;

comment on column public.materials.source_import_batch_id is
  'Bu kayıt yalnızca ilgili Excel aktarımında oluşturulduysa batch id; silmede koşullu silinir.';

-- ---------------------------------------------------------------------------
-- Parça başına malzeme ihtiyacı (P ↔ H — tek seviye)
-- ---------------------------------------------------------------------------
create table if not exists public.part_material_requirements (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete restrict,
  quantity_per_unit numeric not null default 1,
  unit text not null default 'adet',
  note text,
  created_at timestamptz not null default now(),
  unique (part_id, material_id)
);

create index if not exists part_material_requirements_part_id_idx
  on public.part_material_requirements (part_id);
create index if not exists part_material_requirements_material_id_idx
  on public.part_material_requirements (material_id);

-- ---------------------------------------------------------------------------
-- Rota: Excel operasyon metninden ayrıştırılan adımlar
-- ---------------------------------------------------------------------------
create table if not exists public.part_route_steps (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts (id) on delete cascade,
  step_no int not null check (step_no >= 1),
  operation_label text not null,
  assigned_company_id uuid references public.companies (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (part_id, step_no)
);

create index if not exists part_route_steps_part_id_idx
  on public.part_route_steps (part_id);

-- ---------------------------------------------------------------------------
-- RLS (geliştirme)
-- ---------------------------------------------------------------------------
alter table public.part_material_requirements enable row level security;
alter table public.part_route_steps enable row level security;

drop policy if exists "dev_all_part_material_requirements" on public.part_material_requirements;
create policy "dev_all_part_material_requirements"
  on public.part_material_requirements for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "dev_all_part_route_steps" on public.part_route_steps;
create policy "dev_all_part_route_steps"
  on public.part_route_steps for all to anon, authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Aktarım silme: parça → (cascade BOM/rota/atama) → grup → batch’e özel malzeme → batch
-- ---------------------------------------------------------------------------
create or replace function public.delete_import_batch_cascade(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if p_batch_id is null then
    return;
  end if;

  delete from public.parts where import_batch_id = p_batch_id;

  delete from public.assembly_groups where import_batch_id = p_batch_id;

  delete from public.materials m
  where m.source_import_batch_id = p_batch_id
    and not exists (select 1 from public.parts p where p.material_id = m.id)
    and not exists (
      select 1 from public.production_order_lines pol
      where pol.material_id = m.id
    )
    and not exists (
      select 1 from public.stock_movements sm
      where sm.material_id = m.id
    );

  delete from public.import_batches where id = p_batch_id;
end;
$$;

comment on function public.delete_import_batch_cascade(uuid) is
  'Excel aktarımını, ilişkili parça/grupları ve yalnızca bu batch ile oluşmuş, başka yerde kullanılmayan malzemeleri siler.';

grant execute on function public.delete_import_batch_cascade(uuid) to anon, authenticated;
