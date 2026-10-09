/**
 * Minimal dependency-free .xlsx reader.
 *
 * An .xlsx is a ZIP containing `xl/worksheets/sheetN.xml`, `xl/workbook.xml` and
 * `xl/sharedStrings.xml`. We only ever need to read a handful of cells out of a
 * supplier spreadsheet, so rather than adding an xlsx dependency (and forcing an
 * `npm install` before these scripts can run) we inflate the ZIP with node's
 * built-in zlib and pull the cells out with regexes.
 *
 * Exposes: readSheetRows(zipPath, sheetName) -> Array<Record<colLetter, string>>
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;

/** Parse the ZIP central directory into { name -> Buffer } of inflated entries. */
function unzip(zipPath) {
  const buf = fs.readFileSync(zipPath);

  // End-of-central-directory record lives in the last ~64KB (comment may follow).
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`Not a ZIP archive: ${zipPath}`);

  const entryCount = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);

  const files = new Map();
  for (let n = 0; n < entryCount; n++) {
    if (buf.readUInt32LE(ptr) !== SIG_CENTRAL) break;

    const method = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);

    // The local header repeats name/extra with its own lengths — trust those.
    const lhNameLen = buf.readUInt16LE(localOffset + 26);
    const lhExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compressedSize);

    files.set(name, method === 8 ? zlib.inflateRawSync(raw) : Buffer.from(raw));
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const XML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeXml(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => XML_ENTITIES[m]);
}

/** Concatenate every <t>..</t> inside a chunk (rich-text runs split a value). */
function joinTextNodes(chunk) {
  const out = [];
  for (const m of chunk.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) out.push(decodeXml(m[1]));
  return out.join('');
}

function readSharedStrings(files) {
  const entry = files.get('xl/sharedStrings.xml');
  if (!entry) return [];
  const xml = entry.toString('utf8');
  const strings = [];
  for (const m of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) strings.push(joinTextNodes(m[1]));
  return strings;
}

/** Map a visible sheet name to its `xl/worksheets/sheetN.xml` part. */
function resolveSheetPath(files, sheetName) {
  const workbook = files.get('xl/workbook.xml').toString('utf8');
  const rels = files.get('xl/_rels/workbook.xml.rels').toString('utf8');

  let rid = null;
  for (const m of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const name = /name="([^"]*)"/.exec(attrs)?.[1];
    if (name && decodeXml(name) === sheetName) {
      rid = /r:id="([^"]*)"/.exec(attrs)?.[1];
      break;
    }
  }
  if (!rid) throw new Error(`Sheet not found: ${sheetName}`);

  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    if (/Id="([^"]*)"/.exec(attrs)?.[1] !== rid) continue;
    let target = /Target="([^"]*)"/.exec(attrs)?.[1] ?? '';
    target = target.replace(/^\/?xl\//, '').replace(/^\.\//, '');
    return `xl/${target}`;
  }
  throw new Error(`Relationship not found for sheet: ${sheetName} (${rid})`);
}

/**
 * Read a worksheet as an array of row objects keyed by column letter.
 * Index 0 is row 1. Sparse rows are preserved at their real row number, so
 * `rows[20]` is always spreadsheet row 21.
 */
export function readSheetRows(zipPath, sheetName) {
  const files = unzip(zipPath);
  const shared = readSharedStrings(files);
  const xml = files.get(resolveSheetPath(files, sheetName)).toString('utf8');

  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNum = parseInt(/r="(\d+)"/.exec(rowMatch[1])?.[1] ?? '0', 10);
    const cells = {};

    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const inner = cellMatch[2] ?? '';
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      if (!ref) continue;
      const type = /t="([^"]*)"/.exec(attrs)?.[1];

      let value;
      if (type === 's') {
        const idx = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        value = idx == null ? '' : (shared[Number(idx)] ?? '');
      } else if (type === 'inlineStr') {
        value = joinTextNodes(inner);
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        value = raw == null ? '' : decodeXml(raw);
      }

      if (value !== '') cells[ref] = value;
    }

    if (rowNum > 0) rows[rowNum - 1] = cells;
  }

  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = {};
  return rows;
}
