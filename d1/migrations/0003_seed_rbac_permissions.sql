PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO permissions (id, module, action) VALUES
  ('platform_dashboard.read', 'platform_dashboard', 'read'),
  ('factories.read', 'factories', 'read'),
  ('factories.create', 'factories', 'create'),
  ('factories.update', 'factories', 'update'),
  ('factories.approve', 'factories', 'approve'),
  ('factories.activate', 'factories', 'activate'),
  ('factories.suspend', 'factories', 'suspend'),
  ('licenses_packages.read', 'licenses_packages', 'read'),
  ('licenses_packages.create', 'licenses_packages', 'create'),
  ('licenses_packages.update', 'licenses_packages', 'update'),
  ('dashboard.read', 'dashboard', 'read'),
  ('excel_import.read', 'excel_import', 'read'),
  ('excel_import.create', 'excel_import', 'create'),
  ('excel_import.update', 'excel_import', 'update'),
  ('parts_materials.read', 'parts_materials', 'read'),
  ('parts_materials.create', 'parts_materials', 'create'),
  ('parts_materials.update', 'parts_materials', 'update'),
  ('parts_materials.delete', 'parts_materials', 'delete'),
  ('assembly_groups.read', 'assembly_groups', 'read'),
  ('assembly_groups.create', 'assembly_groups', 'create'),
  ('assembly_groups.update', 'assembly_groups', 'update'),
  ('assembly_groups.delete', 'assembly_groups', 'delete'),
  ('production_orders.read', 'production_orders', 'read'),
  ('production_orders.create', 'production_orders', 'create'),
  ('production_orders.update', 'production_orders', 'update'),
  ('production_orders.delete', 'production_orders', 'delete'),
  ('warehouse_stock.read', 'warehouse_stock', 'read'),
  ('warehouse_stock.create', 'warehouse_stock', 'create'),
  ('warehouse_stock.update', 'warehouse_stock', 'update'),
  ('warehouse_stock.delete', 'warehouse_stock', 'delete'),
  ('stock_movements.read', 'stock_movements', 'read'),
  ('stock_movements.create', 'stock_movements', 'create'),
  ('stock_movements.update', 'stock_movements', 'update'),
  ('shipments.read', 'shipments', 'read'),
  ('shipments.create', 'shipments', 'create'),
  ('shipments.update', 'shipments', 'update'),
  ('shipments.delete', 'shipments', 'delete'),
  ('suppliers.read', 'suppliers', 'read'),
  ('suppliers.create', 'suppliers', 'create'),
  ('suppliers.update', 'suppliers', 'update'),
  ('suppliers.delete', 'suppliers', 'delete'),
  ('reports.read', 'reports', 'read'),
  ('mrp.read', 'mrp', 'read'),
  ('user_management.read', 'user_management', 'read'),
  ('user_management.create', 'user_management', 'create'),
  ('user_management.update', 'user_management', 'update'),
  ('user_management.delete', 'user_management', 'delete'),
  ('user_management.assign_role', 'user_management', 'assign_role'),
  ('invitations.read', 'invitations', 'read'),
  ('invitations.create', 'invitations', 'create'),
  ('invitations.update', 'invitations', 'update'),
  ('company_settings.read', 'company_settings', 'read'),
  ('company_settings.update', 'company_settings', 'update');

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'platform_admin', id FROM permissions WHERE id IN (
  'platform_dashboard.read',
  'factories.read', 'factories.create', 'factories.update',
  'factories.approve', 'factories.activate', 'factories.suspend',
  'licenses_packages.read', 'licenses_packages.create', 'licenses_packages.update',
  'user_management.read', 'company_settings.read', 'invitations.read'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'company_admin', id FROM permissions WHERE id IN (
  'dashboard.read',
  'excel_import.read', 'excel_import.create', 'excel_import.update',
  'parts_materials.read', 'parts_materials.create', 'parts_materials.update', 'parts_materials.delete',
  'assembly_groups.read', 'assembly_groups.create', 'assembly_groups.update', 'assembly_groups.delete',
  'production_orders.read', 'production_orders.create', 'production_orders.update', 'production_orders.delete',
  'warehouse_stock.read', 'warehouse_stock.create', 'warehouse_stock.update', 'warehouse_stock.delete',
  'stock_movements.read', 'stock_movements.create', 'stock_movements.update',
  'shipments.read', 'shipments.create', 'shipments.update', 'shipments.delete',
  'suppliers.read', 'suppliers.create', 'suppliers.update', 'suppliers.delete',
  'reports.read', 'mrp.read',
  'user_management.read', 'user_management.create', 'user_management.update',
  'user_management.delete', 'user_management.assign_role',
  'invitations.read', 'invitations.create', 'invitations.update',
  'company_settings.read', 'company_settings.update'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'production_user', id FROM permissions WHERE id IN (
  'dashboard.read',
  'production_orders.read', 'production_orders.create', 'production_orders.update',
  'parts_materials.read', 'assembly_groups.read', 'reports.read', 'mrp.read'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'warehouse_user', id FROM permissions WHERE id IN (
  'dashboard.read',
  'warehouse_stock.read', 'warehouse_stock.create', 'warehouse_stock.update',
  'stock_movements.read', 'stock_movements.create', 'stock_movements.update',
  'parts_materials.read', 'reports.read', 'mrp.read'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'shipment_user', id FROM permissions WHERE id IN (
  'dashboard.read',
  'shipments.read', 'shipments.create', 'shipments.update',
  'warehouse_stock.read', 'reports.read', 'mrp.read'
);

INSERT OR IGNORE INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions WHERE id IN ('dashboard.read', 'reports.read');
