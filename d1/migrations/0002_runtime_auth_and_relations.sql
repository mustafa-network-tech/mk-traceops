PRAGMA foreign_keys = ON;

CREATE TABLE auth_credentials (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 210000 CHECK(iterations >= 100000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE pending_registration_credentials (
  request_id TEXT PRIMARY KEY REFERENCES factory_registration_requests(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 210000 CHECK(iterations >= 100000),
  created_at TEXT NOT NULL
);

CREATE TABLE material_supplier_relations (
  id TEXT PRIMARY KEY,
  factory_id TEXT NOT NULL REFERENCES factories(id) ON DELETE RESTRICT,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  last_purchase_price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  last_purchase_date TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
  priority_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(factory_id,material_id,supplier_id)
);

CREATE INDEX auth_credentials_email_idx ON auth_credentials(email);
CREATE INDEX material_supplier_factory_idx ON material_supplier_relations(factory_id);
