-- Çok seviyeli BOM: parça → alt parça (ağaç) + patlatma (explosion).
-- Kök ve tüm alt düğümlerdeki part_material_requirements toplanır (malzeme bazında SUM).

-- ---------------------------------------------------------------------------
-- Parça → alt parça (montaj hiyerarşisi)
-- ---------------------------------------------------------------------------
create table if not exists public.part_child_parts (
  id uuid primary key default gen_random_uuid(),
  parent_part_id uuid not null references public.parts (id) on delete cascade,
  child_part_id uuid not null references public.parts (id) on delete cascade,
  quantity_per_parent numeric not null default 1,
  unit text not null default 'adet',
  note text,
  created_at timestamptz not null default now(),
  constraint part_child_parts_distinct check (parent_part_id <> child_part_id),
  constraint part_child_parts_qty_pos check (quantity_per_parent > 0),
  unique (parent_part_id, child_part_id)
);

create index if not exists part_child_parts_parent_idx
  on public.part_child_parts (parent_part_id);
create index if not exists part_child_parts_child_idx
  on public.part_child_parts (child_part_id);

comment on table public.part_child_parts is
  'Üst parça başına alt parça miktarı; çok seviyeli BOM patlatması için.';

-- ---------------------------------------------------------------------------
-- RLS: üst ve alt parça aynı fabrikada ve kullanıcının fabrikası
-- ---------------------------------------------------------------------------
alter table public.part_child_parts enable row level security;

drop policy if exists "part_child_parts_tenant" on public.part_child_parts;
create policy "part_child_parts_tenant"
  on public.part_child_parts
  for all
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts pp
      join public.parts pc on pc.id = part_child_parts.child_part_id
        and pc.factory_id = pp.factory_id
      where pp.id = part_child_parts.parent_part_id
        and pp.factory_id = public.rbac_my_factory_id()
    )
  )
  with check (
    public.rbac_is_platform_admin()
    or exists (
      select 1
      from public.parts pp
      join public.parts pc on pc.id = part_child_parts.child_part_id
        and pc.factory_id = pp.factory_id
      where pp.id = part_child_parts.parent_part_id
        and pp.factory_id = public.rbac_my_factory_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Patlatma: kök + recursive alt parçalar; her düğümdeki malzeme ihtiyaçları toplanır
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
    where bt.depth < 24
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
  'Kök parça miktarı için çok seviyeli BOM patlatması; malzeme bazında toplam ihtiyaç.';

grant execute on function public.explode_part_bom(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Üretim çıkışı: UE satırı yokken patlatılmış BOM
-- ---------------------------------------------------------------------------
create or replace function public.record_production_output(
  p_order_id uuid,
  p_good_qty numeric,
  p_location_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_fid uuid;
  o public.production_orders%rowtype;
  rec record;
  v_planned numeric;
  v_produced numeric;
  v_new_produced numeric;
  v_ratio numeric;
  v_mat_need numeric;
  v_new_mat numeric;
  v_prod_unit text;
  v_part_id uuid;
  v_status text;
  v_bom_used boolean := false;
begin
  if p_good_qty is null or p_good_qty <= 0 then
    raise exception 'Üretim miktarı pozitif olmalıdır';
  end if;

  select po.* into strict o
  from public.production_orders po
  where po.id = p_order_id
  for update;

  v_fid := o.factory_id;
  v_planned := o.quantity_planned;
  v_produced := o.quantity_produced;

  if not public.rbac_is_platform_admin() then
    if public.rbac_my_factory_id() is distinct from v_fid then
      raise exception 'Bu fabrika için yetkiniz yok';
    end if;
  end if;

  if o.status not in ('planlandı', 'üretimde') then
    raise exception 'Yalnız planlandı veya üretimde emirlerde çıkış kaydedilir';
  end if;

  if o.approved_at is null then
    raise exception
      'Onaysız emirde üretim çıkışı kaydedilemez. Taslak önce «Planlamaya al» ile onaylanmalıdır.';
  end if;

  if v_planned is null or v_planned <= 0 then
    raise exception 'Planlanan miktar geçersiz';
  end if;

  if v_produced + p_good_qty > v_planned then
    raise exception 'Üretilen toplam planı aşamaz (plan: %, mevcut üretilen: %, ek: %)',
      v_planned, v_produced, p_good_qty;
  end if;

  if not exists (
    select 1 from public.locations l
    where l.id = p_location_id and l.factory_id = v_fid
  ) then
    raise exception 'Lokasyon bu fabrikaya ait değil';
  end if;

  select pr.unit into v_prod_unit
  from public.products pr
  where pr.id = o.product_id and pr.factory_id = v_fid;
  if v_prod_unit is null then
    raise exception 'Ürün bulunamadı';
  end if;

  v_new_produced := v_produced + p_good_qty;
  v_ratio := p_good_qty / v_planned;

  if exists (
    select 1 from public.production_order_lines pol
    where pol.production_order_id = p_order_id
  ) then
    for rec in
      select pol.material_id, pol.quantity_used, pol.unit
      from public.production_order_lines pol
      where pol.production_order_id = p_order_id
    loop
      v_mat_need := rec.quantity_used * v_ratio;
      if v_mat_need <= 0 then
        continue;
      end if;
      update public.materials m
      set current_stock = m.current_stock - v_mat_need
      where m.id = rec.material_id and m.factory_id = v_fid
      returning m.current_stock into v_new_mat;
      if not found then
        raise exception 'Malzeme güncellenemedi: %', rec.material_id;
      end if;
      if v_new_mat < 0 then
        raise exception 'Yetersiz stok: malzeme %', rec.material_id;
      end if;
      insert into public.stock_movements (
        factory_id,
        material_id,
        type,
        quantity,
        unit,
        occurred_at,
        location_id,
        production_order_id,
        assembly_group_id,
        note
      ) values (
        v_fid,
        rec.material_id,
        'üretimde_kullanım',
        v_mat_need,
        coalesce(nullif(trim(rec.unit), ''), 'adet'),
        now(),
        p_location_id,
        p_order_id,
        o.assembly_group_id,
        format('UE %s — üretim çıkışı', o.order_no)
      );
    end loop;
  else
    select p.id into v_part_id
    from public.products pr
    join public.parts p
      on p.factory_id = pr.factory_id
     and lower(trim(p.part_code)) = lower(trim(pr.code))
    where pr.id = o.product_id and pr.factory_id = v_fid
    limit 1;

    if v_part_id is null then
      select p.id into v_part_id
      from public.products pr
      join public.parts p
        on p.factory_id = pr.factory_id
       and lower(trim(p.part_code)) = lower(trim(pr.name))
      where pr.id = o.product_id and pr.factory_id = v_fid
      limit 1;
    end if;

    if v_part_id is null then
      raise exception 'UE satırı yok ve mamul için eşleşen parça/BOM bulunamadı';
    end if;

    for rec in
      select e.material_id, e.quantity, e.unit
      from public.explode_part_bom(v_part_id, p_good_qty) e
    loop
      v_bom_used := true;
      v_mat_need := rec.quantity;
      if v_mat_need <= 0 then
        continue;
      end if;
      update public.materials m
      set current_stock = m.current_stock - v_mat_need
      where m.id = rec.material_id and m.factory_id = v_fid
      returning m.current_stock into v_new_mat;
      if not found then
        raise exception 'Malzeme güncellenemedi: %', rec.material_id;
      end if;
      if v_new_mat < 0 then
        raise exception 'Yetersiz stok: malzeme %', rec.material_id;
      end if;
      insert into public.stock_movements (
        factory_id,
        material_id,
        type,
        quantity,
        unit,
        occurred_at,
        location_id,
        production_order_id,
        assembly_group_id,
        note
      ) values (
        v_fid,
        rec.material_id,
        'üretimde_kullanım',
        v_mat_need,
        coalesce(nullif(trim(rec.unit), ''), 'adet'),
        now(),
        p_location_id,
        p_order_id,
        o.assembly_group_id,
        format('UE %s — patlatılmış BOM üretim çıkışı', o.order_no)
      );
    end loop;

    if not v_bom_used then
      raise exception
        'Patlatılmış BOM boş: kök veya alt parçalarda malzeme satırı (BOM) tanımlayın.';
    end if;
  end if;

  insert into public.product_stock_items (
    product_id,
    current_stock,
    last_production_date,
    location_id
  ) values (
    o.product_id,
    p_good_qty,
    (now() at time zone 'utc')::date,
    p_location_id
  )
  on conflict (product_id, location_id) do update
  set
    current_stock = public.product_stock_items.current_stock + excluded.current_stock,
    last_production_date = greatest(
      coalesce(public.product_stock_items.last_production_date, excluded.last_production_date),
      excluded.last_production_date
    );

  v_status := o.status;
  if v_new_produced >= v_planned then
    v_status := 'tamamlandı';
  elsif o.status = 'planlandı' then
    v_status := 'üretimde';
  end if;

  update public.production_orders po
  set
    quantity_produced = v_new_produced,
    status = v_status
  where po.id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'quantity_produced', v_new_produced,
    'status', v_status
  );
end;
$$;

comment on function public.record_production_output(uuid, numeric, uuid) is
  'Kapalı döngü: onaylı (approved_at) UE; mamul + malzeme + hareket; UE satırı yokken çok seviyeli BOM patlatması.';

grant execute on function public.record_production_output(uuid, numeric, uuid) to authenticated;
