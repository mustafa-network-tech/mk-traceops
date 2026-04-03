-- UE malzeme satırlarını patlatılmış BOM ile doldurur (plan miktarı × explode_part_bom).

create or replace function public.fill_production_order_lines_from_bom(
  p_order_id uuid,
  p_replace_existing boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_fid uuid;
  o public.production_orders%rowtype;
  v_part_id uuid;
  v_inserted int;
  v_prod_unit text;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  if public.rbac_is_platform_admin() then
    raise exception 'Bu işlem fabrika paneli kullanıcıları içindir';
  end if;

  v_fid := public.rbac_my_factory_id();
  if v_fid is null then
    raise exception 'Fabrika bağlamı yok';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.factory_id = v_fid
      and p.status = 'active'
  ) then
    raise exception 'Geçersiz oturum';
  end if;

  select po.* into strict o
  from public.production_orders po
  where po.id = p_order_id
  for update;

  if o.factory_id is distinct from v_fid then
    raise exception 'Bu emir sizin fabrikanıza ait değil';
  end if;

  if o.status in ('iptal', 'tamamlandı') then
    raise exception 'İptal veya tamamlanmış emirde satır doldurulamaz';
  end if;

  if coalesce(o.quantity_produced, 0) > 0 then
    raise exception 'Üretim çıkışı kaydı varken BOM satırları değiştirilemez';
  end if;

  if o.quantity_planned is null or o.quantity_planned <= 0 then
    raise exception 'Planlanan miktar geçersiz';
  end if;

  select pr.unit into v_prod_unit
  from public.products pr
  where pr.id = o.product_id and pr.factory_id = v_fid
  limit 1;

  if v_prod_unit is null then
    raise exception 'Ürün bulunamadı';
  end if;

  if exists (
    select 1 from public.production_order_lines pol
    where pol.production_order_id = p_order_id
  ) and not coalesce(p_replace_existing, false) then
    raise exception 'UE satırları zaten var. Üzerine yazmak için p_replace_existing := true gönderin.';
  end if;

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
    raise exception 'Mamul için eşleşen parça bulunamadı (ürün kodu/adı ↔ part_code)';
  end if;

  if not exists (
    select 1 from public.explode_part_bom(v_part_id, o.quantity_planned) e
  ) then
    raise exception 'Patlatılmış BOM boş: parça ve altlarında malzeme satırı tanımlayın';
  end if;

  if coalesce(p_replace_existing, false) then
    delete from public.production_order_lines
    where production_order_id = p_order_id;
  end if;

  insert into public.production_order_lines (
    production_order_id,
    material_id,
    quantity_used,
    unit,
    note
  )
  select
    p_order_id,
    e.material_id,
    e.quantity,
    coalesce(nullif(trim(e.unit), ''), 'adet'),
    format('BOM patlatması — plan %.10g %s', o.quantity_planned, v_prod_unit)
  from public.explode_part_bom(v_part_id, o.quantity_planned) e;

  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'order_id', p_order_id,
    'line_count', v_inserted,
    'replaced', coalesce(p_replace_existing, false)
  );
end;
$$;

comment on function public.fill_production_order_lines_from_bom(uuid, boolean) is
  'UE malzeme satırlarını explode_part_bom(plan miktarı) ile yazar; üretim çıkışı yokken.';

grant execute on function public.fill_production_order_lines_from_bom(uuid, boolean) to authenticated;
