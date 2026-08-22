PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS _test_assertions (name TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1));
DELETE FROM _test_assertions;

INSERT OR REPLACE INTO factories(id,name,slug,status,created_at,updated_at) VALUES
 ('f-a','Factory A','factory-a','active','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),
 ('f-b','Factory B','factory-b','active','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO material_categories(id,factory_id,name,code,created_at) VALUES
 ('cat-a','f-a','General','GEN','2026-01-01T00:00:00.000Z'),('cat-b','f-b','General','GEN','2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO materials(id,factory_id,code,name,type,unit,current_stock,category_id,created_at,updated_at) VALUES
 ('mat-a','f-a','M1','Steel','ham_madde','kg',100,'cat-a','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z'),
 ('mat-b','f-b','M1','Other steel','ham_madde','kg',500,'cat-b','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO parts(id,factory_id,part_code,description,created_at) VALUES
 ('root-a','f-a','ROOT','Root','2026-01-01T00:00:00.000Z'),('child-a','f-a','CHILD','Child','2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO part_child_parts(id,parent_part_id,child_part_id,quantity_per_parent,created_at) VALUES
 ('edge-a','root-a','child-a',2,'2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO part_material_requirements(id,part_id,material_id,quantity_per_unit,unit,created_at) VALUES
 ('req-a','child-a','mat-a',3,'kg','2026-01-01T00:00:00.000Z');

-- BOM result must be 2 parent units * 2 children * 3 kg = 12 kg.
WITH RECURSIVE tree(part_id,qty) AS (
 SELECT 'root-a',2 UNION ALL SELECT e.child_part_id,tree.qty*e.quantity_per_parent FROM tree JOIN part_child_parts e ON e.parent_part_id=tree.part_id
)
INSERT INTO _test_assertions(name,ok)
SELECT 'bom', CASE WHEN (SELECT SUM(tree.qty*r.quantity_per_unit) FROM tree JOIN part_material_requirements r ON r.part_id=tree.part_id)=12 THEN 1 ELSE 0 END;

-- Same code may exist in separate factories, but factory-scoped reads cannot leak rows.
INSERT INTO _test_assertions(name,ok) SELECT 'tenant', CASE WHEN (SELECT COUNT(*) FROM materials WHERE factory_id='f-a')=1
 AND (SELECT current_stock FROM materials WHERE factory_id='f-a' AND code='M1')=100
 THEN 1 ELSE 0 END;

UPDATE materials SET current_stock=current_stock-12,updated_at='2026-01-02T00:00:00.000Z' WHERE factory_id='f-a' AND id='mat-a';
INSERT OR REPLACE INTO locations(id,factory_id,name,code,type,created_at) VALUES ('loc-a','f-a','Main','MAIN','depo','2026-01-01T00:00:00.000Z');
INSERT OR REPLACE INTO stock_movements(id,factory_id,material_id,type,quantity,unit,occurred_at,location_id,created_at)
 VALUES ('mov-a','f-a','mat-a','üretimde_kullanım',12,'kg','2026-01-02T00:00:00.000Z','loc-a','2026-01-02T00:00:00.000Z');
INSERT INTO _test_assertions(name,ok) SELECT 'stock', CASE WHEN (SELECT current_stock FROM materials WHERE id='mat-a')=88
 AND (SELECT COUNT(*) FROM stock_movements WHERE factory_id='f-a')=1
 THEN 1 ELSE 0 END;
SELECT name,ok FROM _test_assertions ORDER BY name;
