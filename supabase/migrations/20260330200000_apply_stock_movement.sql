-- Depo (madde 3): stok hareketi ile materials.current_stock atomik güncelleme.
-- RLS bypass (SECURITY DEFINER); fabrika ve FK doğrulaması fonksiyon içinde.

create or replace function public.apply_stock_movement(
  p_material_id uuid,
  p_type text,
  p_quantity numeric,
  p_unit text,
  p_occurred_at timestamptz,
  p_location_id uuid,
  p_production_order_id uuid default null,
  p_assembly_group_id uuid default null,
  p_project_reference text default null,
  p_note text default null,
  p_supplier_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_fid uuid;
  v_delta numeric;
  v_new_stock numeric;
  v_mov_id uuid;
  v_qty_store numeric;
  v_unit text;
begin
  if p_type not in (
    'giriş',
    'çıkış',
    'üretimde_kullanım',
    'iade',
    'fire',
    'manuel_düzeltme'
  ) then
    raise exception 'Geçersiz hareket tipi';
  end if;

  select m.factory_id
  into v_fid
  from public.materials m
  where m.id = p_material_id;

  if v_fid is null then
    raise exception 'Malzeme bulunamadı';
  end if;

  if not public.rbac_is_platform_admin() then
    if public.rbac_my_factory_id() is distinct from v_fid then
      raise exception 'Bu fabrika için yetkiniz yok';
    end if;
  end if;

  if not exists (
    select 1
    from public.locations l
    where l.id = p_location_id
      and l.factory_id = v_fid
  ) then
    raise exception 'Lokasyon bu fabrikaya ait değil';
  end if;

  if p_production_order_id is not null
     and not exists (
       select 1
       from public.production_orders o
       where o.id = p_production_order_id
         and o.factory_id = v_fid
     ) then
    raise exception 'Üretim emri bu fabrikaya ait değil';
  end if;

  if p_assembly_group_id is not null
     and not exists (
       select 1
       from public.assembly_groups g
       where g.id = p_assembly_group_id
         and g.factory_id = v_fid
     ) then
    raise exception 'Montaj grubu bu fabrikaya ait değil';
  end if;

  if p_supplier_id is not null
     and not exists (
       select 1
       from public.suppliers s
       where s.id = p_supplier_id
         and s.factory_id = v_fid
     ) then
    raise exception 'Tedarikçi bu fabrikaya ait değil';
  end if;

  v_unit := nullif(trim(coalesce(p_unit, '')), '');
  if v_unit is null then
    v_unit := 'adet';
  end if;

  if p_type = 'manuel_düzeltme' then
    if p_quantity is null or p_quantity = 0 then
      raise exception 'Manuel düzeltme için miktar sıfır olamaz';
    end if;
    v_delta := p_quantity;
    v_qty_store := p_quantity;
  else
    if p_quantity is null or p_quantity <= 0 then
      raise exception 'Miktar pozitif olmalıdır';
    end if;
    v_qty_store := p_quantity;
    v_delta := case p_type
      when 'giriş' then p_quantity
      when 'iade' then p_quantity
      when 'çıkış' then -p_quantity
      when 'üretimde_kullanım' then -p_quantity
      when 'fire' then -p_quantity
      else 0
    end case;
  end if;

  update public.materials m
  set current_stock = m.current_stock + v_delta
  where m.id = p_material_id
    and m.factory_id = v_fid
  returning m.current_stock into v_new_stock;

  if not found then
    raise exception 'Stok güncellenemedi';
  end if;

  if v_new_stock < 0 then
    raise exception 'Yetersiz stok: işlem sonrası bakiye negatif olur';
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
    project_reference,
    note,
    supplier_id
  ) values (
    v_fid,
    p_material_id,
    p_type,
    v_qty_store,
    v_unit,
    coalesce(p_occurred_at, now()),
    p_location_id,
    p_production_order_id,
    p_assembly_group_id,
    nullif(trim(coalesce(p_project_reference, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    p_supplier_id
  )
  returning id into v_mov_id;

  return v_mov_id;
end;
$$;

comment on function public.apply_stock_movement(
  uuid,
  text,
  numeric,
  text,
  timestamptz,
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid
) is 'Depo: stok hareketi + materials.current_stock (tek transaction).';

grant execute on function public.apply_stock_movement(
  uuid,
  text,
  numeric,
  text,
  timestamptz,
  uuid,
  uuid,
  uuid,
  text,
  text,
  uuid
) to authenticated;
