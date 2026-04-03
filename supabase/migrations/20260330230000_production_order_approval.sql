-- Üretim emri: taslak onayı + üretim çıkışı için onay zorunluluğu

alter table public.production_orders
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id) on delete set null;

comment on column public.production_orders.approved_at is
  'Planlamaya alındı / onaylandı zamanı; üretim çıkışı (stok) için zorunlu.';
comment on column public.production_orders.approved_by is
  'Onaylayan fabrika kullanıcısı (profiles.id = auth.uid()).';

-- Mevcut aktif emirler: geriye dönük onay kabulü (çıkış akışı kırılmasın)
update public.production_orders po
set
  approved_at = coalesce(po.approved_at, po.created_at),
  approved_by = coalesce(
    po.approved_by,
    (
      select p.id
      from public.profiles p
      where p.factory_id = po.factory_id
        and p.status = 'active'
      order by p.created_at
      limit 1
    )
  )
where po.approved_at is null
  and po.status in ('planlandı', 'üretimde', 'tamamlandı');

-- ---------------------------------------------------------------------------
-- Taslağı planlamaya al (onay)
-- ---------------------------------------------------------------------------
create or replace function public.approve_production_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  o public.production_orders%rowtype;
  v_fid uuid;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  select po.* into strict o
  from public.production_orders po
  where po.id = p_order_id
  for update;

  v_fid := o.factory_id;

  if not public.rbac_is_platform_admin() then
    if public.rbac_my_factory_id() is distinct from v_fid then
      raise exception 'Bu fabrika için yetkiniz yok';
    end if;
  end if;

  if o.status <> 'taslak' then
    raise exception 'Yalnız taslak emirler onaylanabilir (mevcut durum: %)', o.status;
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.factory_id = v_fid
      and p.status = 'active'
  ) and not public.rbac_is_platform_admin() then
    raise exception 'Onay için fabrika kullanıcısı olmalısınız';
  end if;

  update public.production_orders po
  set
    status = 'planlandı',
    approved_at = now(),
    approved_by = auth.uid()
  where po.id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'planlandı',
    'approved_at', now()
  );
end;
$$;

comment on function public.approve_production_order(uuid) is
  'Taslak UE → planlandı; approved_at/by doldurulur.';

grant execute on function public.approve_production_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Taslağı iptal et (stok etkisi yok)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_draft_production_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  o public.production_orders%rowtype;
  v_fid uuid;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  select po.* into strict o
  from public.production_orders po
  where po.id = p_order_id
  for update;

  v_fid := o.factory_id;

  if not public.rbac_is_platform_admin() then
    if public.rbac_my_factory_id() is distinct from v_fid then
      raise exception 'Bu fabrika için yetkiniz yok';
    end if;
  end if;

  if o.status <> 'taslak' then
    raise exception 'Yalnız taslak emirler iptal edilebilir (mevcut durum: %)', o.status;
  end if;

  update public.production_orders po
  set status = 'iptal'
  where po.id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'status', 'iptal');
end;
$$;

comment on function public.cancel_draft_production_order(uuid) is
  'Taslak UE → iptal; onaysız taslak kapatma.';

grant execute on function public.cancel_draft_production_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Üretim çıkışı: onay şartı
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

    if not exists (
      select 1 from public.part_material_requirements pmr where pmr.part_id = v_part_id
    ) then
      raise exception 'Eşleşen parça için BOM satırı yok';
    end if;

    for rec in
      select pmr.material_id, pmr.quantity_per_unit, pmr.unit
      from public.part_material_requirements pmr
      where pmr.part_id = v_part_id
    loop
      v_mat_need := rec.quantity_per_unit * p_good_qty;
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
        format('UE %s — BOM üretim çıkışı', o.order_no)
      );
    end loop;
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
  'Kapalı döngü: onaylı (approved_at) UE; mamul + malzeme + hareket.';
