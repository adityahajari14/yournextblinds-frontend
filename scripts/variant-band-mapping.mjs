/**
 * Shared helpers for resolving a product color variant to its fabric code and
 * price band, used by the backfill script and the pricing validator.
 *
 * The join key between the product_color_code CSV and Shopify variants is
 * (product family + color name). The fabric code then maps to a price band via
 * `variantCodeBands` in pricing-data.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const ROLLER_BAND_F_TAG = 'roller-band-f';
export const DAY_NIGHT_BAND_H_TAG = 'day-night-band-h';

/** Extracts a fabric code (e.g. R12001, Z100349D) from arbitrary text. */
const FABRIC_CODE_REGEX = /[RZ]\d{4,}D?/;
export function extractFabricCode(text) {
  if (!text) return null;
  const match = String(text).toUpperCase().match(FABRIC_CODE_REGEX);
  return match ? match[0] : null;
}

export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strips the product-type suffix from a Shopify title to get the color family. */
export function familyFromTitle(title) {
  return String(title ?? '')
    .replace(/dual zebra shade/i, '')
    .replace(/roller shades?/i, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

/**
 * Loads the product color->code mapping from a CSV file with rows:
 *   Family,Color,Code
 * Returns lookup maps keyed by "family|color" and by color-only (fallback).
 */
export function loadColorCodeCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const byFamilyColor = new Map();
  const byColor = new Map();
  const rows = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [family, color, code] = trimmed.split(',').map((part) => part.trim());
    if (!family || !color || !code) continue;
    // Skip a header row if present.
    if (normalize(family) === 'product' && normalize(color) === 'color') continue;
    rows.push({ family, color, code });
    byFamilyColor.set(`${normalize(family)}|${normalize(color)}`, code);
    if (!byColor.has(normalize(color))) byColor.set(normalize(color), code);
  }
  return { rows, byFamilyColor, byColor };
}

/** Loads variantCodeBands from pricing-data.json into a code->entry map. */
export function loadVariantCodeBands(pricingDataPath) {
  const data = JSON.parse(fs.readFileSync(pricingDataPath, 'utf8'));
  const byCode = new Map();
  for (const entry of data.variantCodeBands ?? []) {
    byCode.set(entry.code.toUpperCase(), entry);
  }
  const bandNames = new Set(data.priceBands.map((band) => band.name));
  return { byCode, bandNames };
}

/**
 * Resolves a single variant to { code, band, maxWidthInches } using the
 * (family+color) -> code -> band chain. Tries, in order:
 *  - fabric code already present in the color label / SKU
 *  - (family + color) from the CSV
 *  - color-only from the CSV
 * Returns null fields when unresolved.
 */
export function resolveVariant({ family, colorLabel, sku }, csv, codeBands) {
  const codeFromLabel = extractFabricCode(colorLabel) ?? extractFabricCode(sku);
  const code =
    codeFromLabel ??
    csv.byFamilyColor.get(`${normalize(family)}|${normalize(colorLabel)}`) ??
    csv.byColor.get(normalize(colorLabel)) ??
    null;
  const entry = code ? codeBands.byCode.get(code.toUpperCase()) : null;
  return {
    code,
    priceBandName: entry?.priceBandName ?? null,
    maxWidthInches: entry?.maxWidthInches ?? null,
  };
}

export const defaultPricingDataPath = path.join(
  process.cwd(),
  'src',
  'data',
  'pricing',
  'pricing-data.json'
);
