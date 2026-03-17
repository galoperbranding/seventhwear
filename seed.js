// Seed script - Run with: node seed.js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || './data/seventhwear.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '', last_name TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '', role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT DEFAULT 'default',
    first_name TEXT NOT NULL, last_name TEXT NOT NULL, address_line1 TEXT NOT NULL,
    address_line2 TEXT DEFAULT '', city TEXT NOT NULL, state TEXT DEFAULT '',
    postal_code TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'PE', phone TEXT DEFAULT '',
    is_default INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '', price REAL NOT NULL, original_price REAL,
    category TEXT NOT NULL, collection TEXT NOT NULL, badge TEXT,
    colors TEXT DEFAULT '[]', sizes TEXT DEFAULT '[]', images TEXT DEFAULT '[]',
    details TEXT DEFAULT '[]', stock INTEGER DEFAULT 100, is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, product_id TEXT NOT NULL,
    size TEXT NOT NULL DEFAULT 'M', color TEXT DEFAULT '', quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL, user_id TEXT,
    email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    subtotal REAL NOT NULL, shipping_cost REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL NOT NULL, currency TEXT DEFAULT 'EUR', payment_method TEXT DEFAULT 'paypal',
    payment_id TEXT, payment_status TEXT DEFAULT 'pending',
    shipping_address TEXT, billing_address TEXT, notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL,
    product_name TEXT NOT NULL, product_image TEXT DEFAULT '', size TEXT NOT NULL,
    color TEXT DEFAULT '', quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_active INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT, data TEXT DEFAULT '{}',
    expires_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
  CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
  CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
`);

// Seed admin user
const adminEmail = process.env.ADMIN_EMAIL || 'hello@seventhwear.com';
const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
const adminHash = bcrypt.hashSync(adminPass, 12);

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  db.prepare('INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), adminEmail, adminHash, 'Admin', 'SEVENTHWEAR', 'admin');
  console.log(`✓ Admin user created: ${adminEmail}`);
} else {
  console.log(`→ Admin already exists: ${adminEmail}`);
}

// Seed products
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const products = [
  {
    name: 'Oversized Street Tee "Black"', price: 49.00, originalPrice: null,
    category: 'tees', collection: 'street-collection', badge: 'new',
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Camiseta oversize de algodón pesado 240gsm. Corte drop shoulder con costuras reforzadas. Perfecta para la calle y el ride.',
    details: ['100% Algodón orgánico pesado 240gsm', 'Corte oversize drop shoulder', 'Cuello reforzado doble costura', 'Etiqueta tejida SEVENTHWEAR', 'Lavado enzimático para suavidad'],
    sortOrder: 1
  },
  {
    name: 'Oversized Street Tee "White"', price: 49.00, originalPrice: null,
    category: 'tees', collection: 'street-collection', badge: 'new',
    colors: ['white'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Camiseta oversize de algodón pesado 240gsm en blanco. Diseño limpio con detalles premium.',
    details: ['100% Algodón orgánico pesado 240gsm', 'Corte oversize drop shoulder', 'Cuello reforzado doble costura', 'Etiqueta tejida SEVENTHWEAR', 'Lavado enzimático para suavidad'],
    sortOrder: 2
  },
  {
    name: 'Street Cargo Pants "Olive"', price: 89.00, originalPrice: null,
    category: 'pants', collection: 'street-collection', badge: null,
    colors: ['olive'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Pantalón cargo wide fit con bolsillos laterales funcionales. Tela ripstop resistente con elastano para movilidad.',
    details: ['98% Algodón, 2% Elastano', 'Corte wide leg', 'Bolsillos cargo funcionales', 'Cintura ajustable', 'Costuras reforzadas en zonas de estrés'],
    sortOrder: 3
  },
  {
    name: 'Heavy Oversize Hoodie "Black"', price: 79.00, originalPrice: null,
    category: 'hoodies', collection: 'street-collection', badge: null,
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Hoodie oversize de felpa pesada 400gsm. Interior brushed para máximo confort. Capucha con cordón de algodón.',
    details: ['80% Algodón, 20% Poliéster', 'Felpa pesada 400gsm', 'Interior brushed', 'Bolsillo canguro', 'Puños y bajo en rib'],
    sortOrder: 4
  },
  {
    name: 'Ride Jersey "Velocity"', price: 64.00, originalPrice: null,
    category: 'ridewear', collection: 'ride-collection', badge: 'new',
    colors: ['black', 'blue'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Jersey técnico de manga larga para MTB/MX. Tejido moisture-wicking con protección UV. Corte ergonómico para posición de ride.',
    details: ['100% Poliéster técnico', 'Tejido moisture-wicking', 'Protección UV SPF 50+', 'Corte ergonómico para riding', 'Paneles de ventilación mesh'],
    sortOrder: 5
  },
  {
    name: 'Ride Pants "Stealth"', price: 119.00, originalPrice: null,
    category: 'ridewear', collection: 'ride-collection', badge: null,
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Pantalón de riding con refuerzos Cordura en rodillas y trasero. Cintura ajustable y ventilación en muslos.',
    details: ['Nylon/Cordura blend', 'Refuerzos en rodillas y trasero', 'Cintura ajustable con velcro', 'Ventilación en muslos', 'Bolsillos con cremallera'],
    sortOrder: 6
  },
  {
    name: 'Ride Jersey "Desert"', price: 64.00, originalPrice: 85.00,
    category: 'ridewear', collection: 'ride-collection', badge: 'sale',
    colors: ['sand'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Jersey edición Desert. Diseño inspirado en terrenos áridos con tejido ultra-transpirable.',
    details: ['100% Poliéster reciclado', 'Tejido ultra-transpirable', 'Costuras flatlock', 'Print sublimado all-over', 'Corte race fit'],
    sortOrder: 7
  },
  {
    name: 'Heavy Oversize Hoodie "Sand"', price: 69.00, originalPrice: 89.00,
    category: 'hoodies', collection: 'essentials', badge: 'sale',
    colors: ['sand'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Hoodie oversize en tono arena desértico. Felpa pesada 380gsm con acabado mineral wash.',
    details: ['80% Algodón, 20% Poliéster', 'Felpa pesada 380gsm', 'Acabado mineral wash', 'Capucha forrada', 'Etiqueta impresa en cuello'],
    sortOrder: 8
  },
  {
    name: 'Street Cargo Pants "Black"', price: 89.00, originalPrice: null,
    category: 'pants', collection: 'street-collection', badge: null,
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Pantalón cargo negro wide fit. Tela ripstop ligera y resistente con bolsillos cargo utilitarios.',
    details: ['98% Algodón, 2% Elastano', 'Corte wide leg', 'Tela ripstop', 'Bolsillos cargo funcionales', 'Bajo ajustable con cordón'],
    sortOrder: 9
  },
  {
    name: 'Graphic Tee "Seventh Skull"', price: 45.00, originalPrice: 59.00,
    category: 'tees', collection: 'essentials', badge: 'sale',
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Camiseta con gráfico exclusivo Seventh Skull. Print en serigrafía de alta densidad.',
    details: ['100% Algodón orgánico 200gsm', 'Print serigrafía alta densidad', 'Corte regular fit', 'Cuello ribbed reforzado', 'Pre-encogido'],
    sortOrder: 10
  },
  {
    name: 'Windbreaker Jacket "Urban"', price: 119.00, originalPrice: null,
    category: 'jackets', collection: 'street-collection', badge: 'new',
    colors: ['black'], sizes: ['S', 'M', 'L', 'XL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Chaqueta cortavientos con capucha retráctil. Tejido ripstop impermeable DWR. Ideal para la ciudad y el trail.',
    details: ['100% Nylon ripstop', 'Acabado DWR impermeable', 'Capucha retráctil', 'Cremallera YKK', 'Puños con velcro ajustable'],
    sortOrder: 11
  },
  {
    name: 'Oversize Crewneck "Grey"', price: 65.00, originalPrice: null,
    category: 'hoodies', collection: 'essentials', badge: null,
    colors: ['grey'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    images: ['/img/tshirt/polo_seventhwear_1.png', '/img/tshirt/polo_seventhwear_2.png'],
    description: 'Sudadera crewneck oversize en gris melange. Felpa suave 350gsm con corte drop shoulder.',
    details: ['80% Algodón, 20% Poliéster', '350gsm felpa suave', 'Corte drop shoulder', 'Rib en puños y bajo', 'Sin etiquetas interiores'],
    sortOrder: 12
  }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, slug, description, price, original_price, category, collection, badge, colors, sizes, images, details, stock, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, ?)
`);

const insertTransaction = db.transaction(() => {
  for (const p of products) {
    insertProduct.run(
      uuidv4(),
      p.name,
      slugify(p.name),
      p.description,
      p.price,
      p.originalPrice,
      p.category,
      p.collection,
      p.badge,
      JSON.stringify(p.colors),
      JSON.stringify(p.sizes),
      JSON.stringify(p.images),
      JSON.stringify(p.details),
      p.sortOrder
    );
  }
});

insertTransaction();
console.log(`✓ ${products.length} products seeded`);

db.close();
console.log('✓ Database seeded successfully!');
