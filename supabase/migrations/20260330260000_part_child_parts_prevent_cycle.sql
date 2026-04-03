-- part_child_parts: döngüsel BOM (ör. A→B→…→A) ekleme/güncellemeyi reddeder.
-- Kural: yeni kenar (üst→alt) eklendiğinde, üst parça zaten «alt» tarafın
-- mevcut aşağı yönlü zincirinde yer alıyorsa döngü oluşur.

create or replace function public.part_child_parts_check_no_cycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Yalnızca üst/alt uçları veya satır kimliği değişmediyse (ör. miktar, not): kontrol atlanır.
  if tg_op = 'UPDATE'
     and new.parent_part_id is not distinct from old.parent_part_id
     and new.child_part_id is not distinct from old.child_part_id
  then
    return new;
  end if;

  if exists (
    with recursive downstream as (
      select new.child_part_id as pid, 0 as depth
      union all
      select ppc.child_part_id, d.depth + 1
      from downstream d
      inner join public.part_child_parts ppc on ppc.parent_part_id = d.pid
      where d.depth < 64
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
  'BEFORE INSERT/UPDATE: part_child_parts üzerinde döngü oluşturacak kenarları reddeder.';

drop trigger if exists part_child_parts_check_no_cycle_trg on public.part_child_parts;

create trigger part_child_parts_check_no_cycle_trg
  before insert or update on public.part_child_parts
  for each row
  execute procedure public.part_child_parts_check_no_cycle();
