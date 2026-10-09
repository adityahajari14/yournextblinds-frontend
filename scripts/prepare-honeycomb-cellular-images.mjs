/**
 * Downscales the Honeycomb/Cellular imagery.
 *
 * The supplier drop is ~1.2GB of camera-resolution photos (avg 8MB, max 18MB),
 * far too large to upload or commit. This produces web-sized derivatives:
 *
 *   swatches -> Honeycomb-cellular/.optimized/<CODE>.jpg   (gitignored; uploaded to Shopify)
 *   category -> public/collections/honeycomb-cellular/*.webp (committed; used by the collection page)
 *
 * Variant images serve double duty on the PDP — the small swatch grid AND the
 * main gallery image once a colour is selected — hence the 1400px longest edge.
 *
 *   node scripts/prepare-honeycomb-cellular-images.mjs             # both
 *   node scripts/prepare-honeycomb-cellular-images.mjs --swatches
 *   node scripts/prepare-honeycomb-cellular-images.mjs --category
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'Honeycomb-cellular');
const COLORS_CSV = path.join(ROOT, 'scripts', 'data', 'honeycomb-cellular-colors.csv');
const SWATCH_OUT = path.join(SRC, '.optimized');
const CATEGORY_OUT = path.join(ROOT, 'public', 'collections', 'honeycomb-cellular');

const SWATCH_EDGE = 1400;
const CATEGORY_WIDTH = 1200;

/** Supplier filenames are inconsistent (caps, spaces); map them to stable slugs. */
const CATEGORY_IMAGES = {
  'Cellular Honeycomb Shades.png': 'all.webp',
  'Light Filtering Cellular Shades.png': 'light-filtering.webp',
  'BLACKOUT CELLULAR SHADE.png': 'blackout.webp',
  'Top Down Bottom Up Cellular Shades.png': 'top-down-bottom-up.webp',
  'MOTORIZED.png': 'motorized.webp',
  'CORDLESS.jpg': 'cordless.webp',
  'NO DRILL.png': 'no-drill.webp',
  'Water Resistant Cellular Shades.png': 'water-resistant.webp',
  'PRINTED CELLULAR SHADES.png': 'printed.webp',
  'Metallic Sheer Cellular Shades.png': 'metallic-sheer.webp',
};

const mb = (n) => (n / 1048576).toFixed(1);
const kb = (n) => (n / 1024).toFixed(0);

/** Minimal CSV row splitter — handles the quoted StyleName column. */
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function doSwatches() {
  const lines = fs.readFileSync(COLORS_CSV, 'utf8').trim().split('\n');
  const header = splitCsvLine(lines[0]);
  const iCode = header.indexOf('Code');
  const iFile = header.indexOf('SwatchFile');

  const rows = lines.slice(1).map((l) => {
    const c = splitCsvLine(l);
    return { code: c[iCode], file: c[iFile] };
  });

  fs.mkdirSync(SWATCH_OUT, { recursive: true });
  console.log(`Swatches: ${rows.length} -> ${path.relative(ROOT, SWATCH_OUT)}  (${SWATCH_EDGE}px, jpeg q82)`);

  let srcBytes = 0;
  let outBytes = 0;
  let done = 0;

  for (const { code, file } of rows) {
    const src = path.join(SRC, file);
    const dest = path.join(SWATCH_OUT, `${code}.jpg`);
    if (!fs.existsSync(src)) {
      console.warn(`  WARN missing source: ${file}`);
      continue;
    }
    srcBytes += fs.statSync(src).size;

    await sharp(src)
      .rotate()
      .resize(SWATCH_EDGE, SWATCH_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dest);

    outBytes += fs.statSync(dest).size;
    done++;
    if (done % 25 === 0) process.stdout.write(`  ${done}/${rows.length}\n`);
  }

  console.log(`  ${done} written — ${mb(srcBytes)} MB -> ${mb(outBytes)} MB (avg ${kb(outBytes / done)} KB)`);
}

async function doCategory() {
  fs.mkdirSync(CATEGORY_OUT, { recursive: true });
  console.log(`\nCategory art: ${Object.keys(CATEGORY_IMAGES).length} -> ${path.relative(ROOT, CATEGORY_OUT)}  (${CATEGORY_WIDTH}px, webp q80)`);

  let srcBytes = 0;
  let outBytes = 0;

  for (const [srcName, outName] of Object.entries(CATEGORY_IMAGES)) {
    const src = path.join(SRC, 'category images', srcName);
    const dest = path.join(CATEGORY_OUT, outName);
    if (!fs.existsSync(src)) {
      console.warn(`  WARN missing source: ${srcName}`);
      continue;
    }
    srcBytes += fs.statSync(src).size;

    await sharp(src)
      .rotate()
      .resize({ width: CATEGORY_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(dest);

    const size = fs.statSync(dest).size;
    outBytes += size;
    console.log(`  ${outName.padEnd(24)} ${kb(size).padStart(5)} KB`);
  }

  console.log(`  ${mb(srcBytes)} MB -> ${mb(outBytes)} MB`);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Missing ${SRC} — the supplier folder is gitignored; restore it to re-run.`);
  }
  const only = process.argv.slice(2);
  const wantSwatches = only.length === 0 || only.includes('--swatches');
  const wantCategory = only.length === 0 || only.includes('--category');

  if (wantSwatches) await doSwatches();
  if (wantCategory) await doCategory();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
