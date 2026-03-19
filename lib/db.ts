import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/seventhwear.db';

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeTables();
  }
  return db;
}

function initializeTables() {
  const database = db;

  database.exec(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      google_id TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Addresses
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT DEFAULT 'default',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT DEFAULT '',
      city TEXT NOT NULL,
      state TEXT DEFAULT '',
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'PE',
      phone TEXT DEFAULT '',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      original_price REAL,
      category TEXT NOT NULL,
      collection TEXT NOT NULL,
      badge TEXT,
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      details TEXT DEFAULT '[]',
      stock INTEGER DEFAULT 100,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cart
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL DEFAULT 'M',
      color TEXT DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
      subtotal REAL NOT NULL,
      shipping_cost REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      payment_method TEXT DEFAULT 'paypal',
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','completed','failed','refunded')),
      shipping_address TEXT,
      billing_address TEXT,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT DEFAULT '',
      size TEXT NOT NULL,
      color TEXT DEFAULT '',
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Newsletter
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );

    -- Sessions (for guest carts)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      data TEXT DEFAULT '{}',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- CRM: Customer Notes
    CREATE TABLE IF NOT EXISTS customer_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'note' CHECK(type IN ('note', 'call', 'email', 'meeting', 'other')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    -- CRM: Tags
    CREATE TABLE IF NOT EXISTS customer_tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL DEFAULT '#666666',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- CRM: Tag Assignments
    CREATE TABLE IF NOT EXISTS customer_tag_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES customer_tags(id) ON DELETE CASCADE,
      UNIQUE(user_id, tag_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
    CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_customer_tag_assign_user ON customer_tag_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_customer_tag_assign_tag ON customer_tag_assignments(tag_id);

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      actor_id TEXT,
      actor_email TEXT,
      target_type TEXT,
      target_id TEXT,
      ip TEXT,
      details TEXT DEFAULT '',
      severity TEXT DEFAULT 'info' CHECK(severity IN ('info','warn','critical'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
  `);

  // Add tracking_number column if missing (safe migration)
  try {
    database.exec(`ALTER TABLE orders ADD COLUMN tracking_number TEXT DEFAULT NULL`);
  } catch {
    // Column already exists
  }

  // Add google_id and avatar columns if missing (safe migration)
  try {
    database.exec(`ALTER TABLE users ADD COLUMN google_id TEXT DEFAULT ''`);
  } catch { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''`);
  } catch { /* Column already exists */ }

  // Email verification columns (safe migration)
  try {
    database.exec(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`);
  } catch { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE users ADD COLUMN verification_code TEXT DEFAULT NULL`);
  } catch { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE users ADD COLUMN verification_expires DATETIME DEFAULT NULL`);
  } catch { /* Column already exists */ }

  // Mark existing users as verified (they registered before this feature)
  try {
    database.exec(`UPDATE users SET is_verified = 1 WHERE is_verified = 0 AND created_at < datetime('now', '-1 minute')`);
  } catch { /* ignore */ }

  // Birthday field (safe migration)
  try {
    database.exec(`ALTER TABLE users ADD COLUMN birth_date TEXT DEFAULT NULL`);
  } catch { /* Column already exists */ }
// CMS category field (safe migration)
  try {
    database.exec(`ALTER TABLE cms_posts ADD COLUMN category TEXT DEFAULT ''`);
  } catch { /* Column already exists */ }
  // Discount codes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percentage' CHECK(type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      user_id TEXT,
      reason TEXT DEFAULT '',
      expires_at DATETIME NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_discount_code ON discount_codes(code);
    CREATE INDEX IF NOT EXISTS idx_discount_user ON discount_codes(user_id);
  `);

  // ============================================
// AGREGAR ESTO al final de initializeTables()
// en lib/db.ts — antes del último cierre de llave
// ============================================

  // CMS: Blog Posts
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT DEFAULT '',
      content TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      author_id TEXT,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status);
  `);

  // CMS: Lookbook
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_lookbook (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      collection TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CMS: Banners
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_banners (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      cta_text TEXT DEFAULT '',
      cta_url TEXT DEFAULT '/',
      image_url TEXT DEFAULT '',
      position TEXT DEFAULT 'hero' CHECK(position IN ('hero', 'promo', 'announcement')),
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      bg_color TEXT DEFAULT '#000000',
      text_color TEXT DEFAULT '#ffffff',
      starts_at DATETIME,
      ends_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CMS: Páginas estáticas
  database.exec(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      meta_description TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Seed páginas estáticas si no existen
  const pagesExist = database.prepare("SELECT COUNT(*) as c FROM cms_pages").get() as { c: number };
  if (pagesExist.c === 0) {
    const insertPage = database.prepare(`
      INSERT INTO cms_pages (id, slug, title, content, meta_description)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertPage.run('page-brand', 'brand', 'Brand', '<p>Contenido de la página Brand...</p>', 'Conoce la historia de Seventhwear');
    insertPage.run('page-faq', 'faq', 'FAQ', '<p>Preguntas frecuentes...</p>', 'Preguntas frecuentes sobre Seventhwear');
    insertPage.run('page-envios', 'envios', 'Envíos', '<p>Información de envíos...</p>', 'Política de envíos de Seventhwear');
    insertPage.run('page-devoluciones', 'devoluciones', 'Devoluciones', '<p>Política de devoluciones...</p>', 'Política de devoluciones de Seventhwear');
  }


}

export default getDb;
export { getDb };
