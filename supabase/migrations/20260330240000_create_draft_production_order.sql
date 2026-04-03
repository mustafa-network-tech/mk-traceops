-- Taslak üretim emri oluşturma (onay akışına girer; stok çıkışı yok)

create or replace function public.create_draft_production_order(
  p_order_no text,
  p_product_id uuid,
  p_quantity_planned numeric,
  p_scheduled_date date,
  p_department_id uuid,
  p_assembly_group_id uuid default null,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_fid uuid;
  v_no text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  v_no := trim(coalesce(p_order_no, ''));
  if v_no = '' then
    raise exception 'Emir numarası gerekli';
  end if;

  if p_quantity_planned is null or p_quantity_planned <= 0 then
    raise exception 'Planlanan miktar pozitif olmalıdır';
  end if;

  if p_scheduled_date is null then
    raise exception 'Plan tarihi gerekli';
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

  if not exists (
    select 1
    from public.products pr
    where pr.id = p_product_id
      and pr.factory_id = v_fid
  ) then
    raise exception 'Ürün bu fabrikaya ait değil';
  end if;

  if not exists (
    select 1
    from public.departments d
    where d.id = p_department_id
      and d.factory_id = v_fid
  ) then
    raise exception 'Bölüm bu fabrikaya ait değil';
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

  if exists (
    select 1
    from public.production_orders po
    where po.factory_id = v_fid
      and po.order_no = v_no
  ) then
    raise exception 'Bu emir numarası fabrikada zaten kullanılıyor';
  end if;

  insert into public.production_orders (
    factory_id,
    order_no,
    product_id,
    assembly_group_id,
    status,
    quantity_planned,
    quantity_produced,
    scheduled_date,
    department_id,
    notes,
    approved_at,
    approved_by
  ) values (
    v_fid,
    v_no,
    p_product_id,
    p_assembly_group_id,
    'taslak',
    p_quantity_planned,
    0,
    p_scheduled_date,
    p_department_id,
    nullif(trim(coalesce(p_notes, '')), ''),
    null,
    null
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'order_no', v_no,
    'status', 'taslak'
  );
end;
$$;

comment on function public.create_draft_production_order(
  text,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text
) is 'Taslak UE oluşturur; onay sonrası planlandı ve stok çıkışı.';

grant execute on function public.create_draft_production_order(
  text,
  uuid,
  numeric,
  date,
  uuid,
  uuid,
  text
) to authenticated;
