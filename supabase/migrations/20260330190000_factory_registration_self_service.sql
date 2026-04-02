-- Fabrika self-service kayıt: başvuran Auth kullanıcısı + RLS
--
-- Aşağıdaki rbac_* fonksiyonları 20260330180000 içinde de tanımlıdır; burada
-- CREATE OR REPLACE ile tekrarlanır — 180000 uygulanmamış / yarım kalmış
-- ortamlarda bu migration’ın RLS politikaları çalışsın diye.

create or replace function public.rbac_my_factory_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.factory_id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

create or replace function public.rbac_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'platform_admin'::public.app_role
      and p.status = 'active'
  );
$$;

comment on function public.rbac_my_factory_id() is
  'JWT oturumundaki kullanıcının profiles.factory_id; fabrika kullanıcıları için dolu.';
comment on function public.rbac_is_platform_admin() is
  'Platform yöneticisi tam erişim (operasyonel RLS bypass).';

grant execute on function public.rbac_my_factory_id() to authenticated, anon;
grant execute on function public.rbac_is_platform_admin() to authenticated, anon;

alter table public.factory_registration_requests
  add column if not exists applicant_user_id uuid references auth.users (id) on delete set null;

alter table public.factory_registration_requests
  add column if not exists applicant_first_name text;

alter table public.factory_registration_requests
  add column if not exists applicant_last_name text;

create index if not exists factory_registration_requests_applicant_user_id_idx
  on public.factory_registration_requests (applicant_user_id)
  where applicant_user_id is not null;

-- Aynı kullanıcı için tek bekleyen talep; aynı slug için tek bekleyen talep
create unique index if not exists factory_registration_one_pending_per_applicant
  on public.factory_registration_requests (applicant_user_id)
  where status = 'pending' and applicant_user_id is not null;

create unique index if not exists factory_registration_pending_slug_unique
  on public.factory_registration_requests (requested_slug)
  where status = 'pending';

comment on column public.factory_registration_requests.applicant_user_id is
  'Kayıt formu ile oluşan auth.users.id; onayda yeni Auth kullanıcısı açılmaz.';

-- Eski açık politika kalkar; kiracı başvurusu + platform yönetimi
drop policy if exists "dev_all_factory_registration_requests"
  on public.factory_registration_requests;

create policy "factory_registration_requests_select"
  on public.factory_registration_requests
  for select
  to authenticated
  using (
    public.rbac_is_platform_admin()
    or applicant_user_id = auth.uid()
  );

create policy "factory_registration_requests_insert"
  on public.factory_registration_requests
  for insert
  to authenticated
  with check (
    applicant_user_id = auth.uid()
    and status = 'pending'
  );

create policy "factory_registration_requests_update"
  on public.factory_registration_requests
  for update
  to authenticated
  using (public.rbac_is_platform_admin())
  with check (public.rbac_is_platform_admin());
