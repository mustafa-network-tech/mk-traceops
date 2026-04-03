-- MRP (madde 4): panel izni
insert into public.permissions (module, action)
values ('mrp', 'read')
on conflict (module, action) do nothing;

insert into public.role_permissions (role, permission_id)
select 'company_admin'::public.app_role, p.id
from public.permissions p
where p.module = 'mrp' and p.action = 'read'
on conflict (role, permission_id) do nothing;

insert into public.role_permissions (role, permission_id)
select 'production_user'::public.app_role, p.id
from public.permissions p
where p.module = 'mrp' and p.action = 'read'
on conflict (role, permission_id) do nothing;

insert into public.role_permissions (role, permission_id)
select 'warehouse_user'::public.app_role, p.id
from public.permissions p
where p.module = 'mrp' and p.action = 'read'
on conflict (role, permission_id) do nothing;

insert into public.role_permissions (role, permission_id)
select 'shipment_user'::public.app_role, p.id
from public.permissions p
where p.module = 'mrp' and p.action = 'read'
on conflict (role, permission_id) do nothing;
