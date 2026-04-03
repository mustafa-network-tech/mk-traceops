-- Fabrika bazında BOM patlatma / döngü tarama derinlik üst sınırı (tek kaynak).
-- explode_part_bom ve part_child_parts_check_no_cycle aynı factories.bom_explosion_max_depth değerini kullanır.

alter table public.factories
  add column if not exists bom_explosion_max_depth integer not null default 24
  check (bom_explosion_max_depth >= 1 and bom_explosion_max_depth <= 128);

comment on column public.factories.bom_explosion_max_depth is
  'Parça BOM patlatması (explode_part_bom) ve parça bağlantısı döngü kontrolü: köke göre en fazla bu kadar seviye.';

-- ---------------------------------------------------------------------------
create or replace function public.explode_part_bom(
  p_root_part_id uuid,
  p_quantity numeric
)
returns table (
  material_id uuid,
  quantity numeric,
  unit text
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_max int;
begin
  if p_root_part_id is null or p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  if not exists (
    select 1
    from public.parts p
    where p.id = p_root_part_id
      and (
        public.rbac_is_platform_admin()
        or p.factory_id = public.rbac_my_factory_id()
      )
  ) then
    raise exception 'Parça bulunamadı veya bu fabrika için yetkiniz yok';
  end if;

  select coalesce(f.bom_explosion_max_depth, 24) into v_max
  from public.parts p
  inner join public.factories f on f.id = p.factory_id
  where p.id = p_root_part_id
  limit 1;

  if v_max is null or v_max < 1 then
    v_max := 24;
  end if;

  return query
  with recursive bom_tree as (
    select p_root_part_id as pid, p_quantity::numeric as cum, 0 as depth
    union all
    select
      ppc.child_part_id,
      bt.cum * ppc.quantity_per_parent::numeric,
      bt.depth + 1
    from bom_tree bt
    inner join public.part_child_parts ppc on ppc.parent_part_id = bt.pid
    where bt.depth < v_max
  ),
  mats as (
    select
      pmr.material_id,
      sum(pmr.quantity_per_unit::numeric * bt.cum)::numeric as q,
      max(pmr.unit)::text as u
    from bom_tree bt
    inner join public.part_material_requirements pmr on pmr.part_id = bt.pid
    group by pmr.material_id
  )
  select m.material_id, m.q, m.u
  from mats m
  where m.q > 0;
end;
$$;

comment on function public.explode_part_bom(uuid, numeric) is
  'Kök parça miktarı için çok seviyeli BOM patlatması; malzeme bazında toplam ihtiyaç. Derinlik: factories.bom_explosion_max_depth.';

-- ---------------------------------------------------------------------------
create or replace function public.part_child_parts_check_no_cycle()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_max int;
begin
  if tg_op = 'UPDATE'
     and new.parent_part_id is not distinct from old.parent_part_id
     and new.child_part_id is not distinct from old.child_part_id
  then
    return new;
  end if;

  select coalesce(f.bom_explosion_max_depth, 24) into v_max
  from public.parts pp
  inner join public.factories f on f.id = pp.factory_id
  where pp.id = new.parent_part_id
  limit 1;

  if v_max is null or v_max < 1 then
    v_max := 24;
  end if;

  if exists (
    with recursive downstream as (
      select new.child_part_id as pid, 0 as depth
      union all
      select ppc.child_part_id, d.depth + 1
      from downstream d
      inner join public.part_child_parts ppc on ppc.parent_part_id = d.pid
      where d.depth < v_max
        and (tg_op = 'insert' or ppc.id is distinct from new.id)
    )
    select 1
    from downstream
    where pid = new.parent_part_id
    limit 1
  ) then
    raise exception
      'Döngüsel BOM: üst parça, seçilen alt parçanın alt ağacında zaten yer alıyor (bu bağlantı kapatırdı).';
  end if;

  return new;
end;
$$;

comment on function public.part_child_parts_check_no_cycle() is
  'BEFORE INSERT/UPDATE: döngü reddi; tarama derinliği üst parçanın fabrikası bom_explosion_max_depth ile sınırlı.';
