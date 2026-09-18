// Recomprime a WebP las imágenes pesadas de public/ y las reescala a un
// ancho razonable para web. Se ejecuta EN LOCAL, no en el servidor: el
// resultado se commitea ya optimizado, así el hosting no necesita sharp.
//
//   node scripts/optimize-images.mjs --dry    # ver qué haría
//   node scripts/optimize-images.mjs          # aplicar
//
// Los archivos originales se mueven a design-assets/_pre-optimizacion/
// (carpeta ignorada por git) en vez de borrarse.

import sharp from 'sharp';
import { readdir, stat, mkdir, rename, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const PUBLIC_DIR = 'public';
const BACKUP_DIR = 'design-assets/_pre-optimizacion';
const MIN_BYTES = 300 * 1024; // solo lo que pesa de verdad
const MAX_WIDTH = 1920;       // suficiente para pantallas grandes
const QUALITY = 82;           // WebP: indistinguible del original a simple vista
const EXTS = new Set(['.jpg', '.jpeg', '.png']);

const dryRun = process.argv.includes('--dry');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const kb = (bytes) => (bytes / 1024).toFixed(0).padStart(6);

let totalBefore = 0;
let totalAfter = 0;
let count = 0;
const renamed = []; // [rutaWebOriginal, rutaWebNueva]

for await (const path of walk(PUBLIC_DIR)) {
  if (!EXTS.has(extname(path).toLowerCase())) continue;

  const { size } = await stat(path);
  if (size < MIN_BYTES) continue;

  const image = sharp(path);
  const { width } = await image.metadata();
  const target = path.replace(/\.(jpe?g|png)$/i, '.webp');

  const pipeline = image.clone();
  if (width && width > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH });

  const output = await pipeline.webp({ quality: QUALITY }).toBuffer();

  totalBefore += size;
  totalAfter += output.length;
  count++;

  const saved = (100 - (output.length / size) * 100).toFixed(0);
  console.log(`${kb(size)}KB → ${kb(output.length)}KB  (-${saved.padStart(2)}%)  ${relative(PUBLIC_DIR, path)}`);

  renamed.push([
    '/' + relative(PUBLIC_DIR, path),
    '/' + relative(PUBLIC_DIR, target),
  ]);

  if (dryRun) continue;

  await sharp(output).toFile(target);

  // Conservar el original fuera de public/ por si hay que rehacerlo.
  const backupPath = join(BACKUP_DIR, relative(PUBLIC_DIR, path));
  await mkdir(join(backupPath, '..'), { recursive: true });
  await rename(path, backupPath);
}

// Al cambiar la extensión a .webp hay que actualizar las referencias, o el
// sitio queda con imágenes rotas.
async function updateReferences() {
  const sources = [];
  for (const dir of ['app', 'components', 'lib']) {
    for await (const file of walk(dir)) {
      if (/\.(tsx?|css)$/.test(file)) sources.push(file);
    }
  }

  let filesTouched = 0;
  for (const file of sources) {
    const before = await readFile(file, 'utf8');
    let after = before;
    for (const [from, to] of renamed) after = after.split(from).join(to);
    if (after !== before) {
      await writeFile(file, after);
      filesTouched++;
    }
  }
  console.log(`Referencias actualizadas en ${filesTouched} archivos de código`);

  // La DB guarda rutas de imagen en products.images y en las tablas de CMS.
  const db = process.env.DATABASE_PATH || './data/seventhwear.db';
  const statements = [];
  for (const [from, to] of renamed) {
    const esc = from.replace(/'/g, "''");
    const escTo = to.replace(/'/g, "''");
    statements.push(
      `UPDATE products SET images = replace(images, '${esc}', '${escTo}');`,
      `UPDATE cms_banners SET image_url = replace(image_url, '${esc}', '${escTo}');`,
      `UPDATE cms_lookbook SET image_url = replace(image_url, '${esc}', '${escTo}');`,
    );
  }
  try {
    execFileSync('sqlite3', [db, statements.join('\n')]);
    console.log('Referencias actualizadas en la base de datos');
  } catch (error) {
    console.error('No se pudo actualizar la DB:', error.message);
  }
}

if (!dryRun && renamed.length) await updateReferences();

const pct = totalBefore ? (100 - (totalAfter / totalBefore) * 100).toFixed(0) : 0;
console.log(
  `\n${count} imágenes · ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ` +
  `${(totalAfter / 1024 / 1024).toFixed(1)}MB (-${pct}%)` +
  (dryRun ? '  [dry run, no se escribió nada]' : '')
);
