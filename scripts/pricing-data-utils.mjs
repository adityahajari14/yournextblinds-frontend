import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const pricingDataPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'pricing-data.json');
export const pricingReportPath = path.join(process.cwd(), 'src', 'data', 'pricing', 'pricing-report.json');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const result = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

export function getEnv() {
  return {
    ...parseEnvFile(path.join(process.cwd(), '.env')),
    ...parseEnvFile(path.join(process.cwd(), '.env.local')),
    ...process.env,
  };
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

export function checksumPricingData(data) {
  const clone = { ...data };
  delete clone.checksum;
  return crypto.createHash('sha256').update(stableStringify(clone)).digest('hex');
}

export function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function readPricingData() {
  return JSON.parse(fs.readFileSync(pricingDataPath, 'utf8'));
}

function compositeKey(...parts) {
  return parts.map((part) => part ?? '__null__').join('::');
}

export function validatePricingData(data, options = {}) {
  const errors = [];
  const warnings = [];

  if (data.schemaVersion !== 1) {
    errors.push(`Unsupported schemaVersion: ${data.schemaVersion}`);
  }

  for (const field of [
    'priceBands',
    'widthBands',
    'heightBands',
    'priceCells',
    'customizationOptions',
    'customizationPricings',
  ]) {
    if (!Array.isArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
  }

  const priceBandIds = new Set();
  const priceBandNames = new Set();
  for (const band of data.priceBands ?? []) {
    if (!band.id) errors.push('Price band missing id');
    if (!band.name) errors.push(`Price band ${band.id || '(unknown)'} missing name`);
    if (priceBandIds.has(band.id)) errors.push(`Duplicate price band id: ${band.id}`);
    if (priceBandNames.has(band.name)) errors.push(`Duplicate price band name: ${band.name}`);
    priceBandIds.add(band.id);
    priceBandNames.add(band.name);
  }

  const widthBandIds = new Set();
  for (const band of data.widthBands ?? []) {
    if (widthBandIds.has(band.id)) errors.push(`Duplicate width band id: ${band.id}`);
    if (!Number.isFinite(band.widthMm) || !Number.isFinite(band.widthInches)) {
      errors.push(`Invalid width band: ${band.id}`);
    }
    widthBandIds.add(band.id);
  }
  const widthBySortOrder = [...(data.widthBands ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const widthBySize = [...(data.widthBands ?? [])].sort(
    (a, b) => a.widthInches - b.widthInches || a.widthMm - b.widthMm
  );
  if (widthBySortOrder.some((band, index) => band.id !== widthBySize[index]?.id)) {
    errors.push('Width band sortOrder must match ascending width size order');
  }

  const heightBandIds = new Set();
  for (const band of data.heightBands ?? []) {
    if (heightBandIds.has(band.id)) errors.push(`Duplicate height band id: ${band.id}`);
    if (!Number.isFinite(band.heightMm) || !Number.isFinite(band.heightInches)) {
      errors.push(`Invalid height band: ${band.id}`);
    }
    heightBandIds.add(band.id);
  }
  const heightBySortOrder = [...(data.heightBands ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const heightBySize = [...(data.heightBands ?? [])].sort(
    (a, b) => a.heightInches - b.heightInches || a.heightMm - b.heightMm
  );
  if (heightBySortOrder.some((band, index) => band.id !== heightBySize[index]?.id)) {
    errors.push('Height band sortOrder must match ascending height size order');
  }

  const cellKeys = new Set();
  for (const cell of data.priceCells ?? []) {
    if (!priceBandIds.has(cell.priceBandId)) {
      errors.push(`Price cell ${cell.id} references missing price band ${cell.priceBandId}`);
    }
    if (!widthBandIds.has(cell.widthBandId)) {
      errors.push(`Price cell ${cell.id} references missing width band ${cell.widthBandId}`);
    }
    if (!heightBandIds.has(cell.heightBandId)) {
      errors.push(`Price cell ${cell.id} references missing height band ${cell.heightBandId}`);
    }
    if (!Number.isFinite(cell.price) || cell.price < 0) {
      errors.push(`Price cell ${cell.id} has invalid price ${cell.price}`);
    }
    const key = compositeKey(cell.priceBandId, cell.widthBandId, cell.heightBandId);
    if (cellKeys.has(key)) errors.push(`Duplicate price cell: ${key}`);
    cellKeys.add(key);
  }

  const optionIds = new Set();
  const optionKeys = new Set();
  for (const option of data.customizationOptions ?? []) {
    if (optionIds.has(option.id)) errors.push(`Duplicate customization option id: ${option.id}`);
    const key = compositeKey(option.category, option.optionId);
    if (optionKeys.has(key)) errors.push(`Duplicate customization option key: ${key}`);
    optionIds.add(option.id);
    optionKeys.add(key);
  }

  const pricingKeys = new Set();
  for (const pricing of data.customizationPricings ?? []) {
    if (!optionIds.has(pricing.customizationOptionId)) {
      errors.push(`Customization pricing ${pricing.id} references missing option ${pricing.customizationOptionId}`);
    }
    if (pricing.widthBandId && !widthBandIds.has(pricing.widthBandId)) {
      errors.push(`Customization pricing ${pricing.id} references missing width band ${pricing.widthBandId}`);
    }
    if (!Number.isFinite(pricing.price) || pricing.price < 0) {
      errors.push(`Customization pricing ${pricing.id} has invalid price ${pricing.price}`);
    }
    const key = compositeKey(pricing.customizationOptionId, pricing.widthBandId);
    if (pricingKeys.has(key)) errors.push(`Duplicate customization pricing: ${key}`);
    pricingKeys.add(key);
  }

  const seenVariantCodes = new Set();
  for (const entry of data.variantCodeBands ?? []) {
    if (!entry.code) errors.push('variantCodeBand entry missing code');
    const upper = (entry.code ?? '').toUpperCase();
    if (seenVariantCodes.has(upper)) errors.push(`Duplicate variantCodeBand code: ${entry.code}`);
    seenVariantCodes.add(upper);
    if (!priceBandNames.has(entry.priceBandName)) {
      errors.push(`variantCodeBand "${entry.code}" references missing price band "${entry.priceBandName}"`);
    }
    if (
      entry.maxWidthInches !== null &&
      entry.maxWidthInches !== undefined &&
      (!Number.isFinite(entry.maxWidthInches) || entry.maxWidthInches <= 0)
    ) {
      errors.push(`variantCodeBand "${entry.code}" has invalid maxWidthInches`);
    }
  }

  // Warn on price cells that drop sharply vs. their left/top neighbor (likely
  // corrupted source values, e.g. the known bad cells awaiting correction).
  const bandCells = new Map();
  for (const cell of data.priceCells ?? []) {
    if (!bandCells.has(cell.priceBandId)) bandCells.set(cell.priceBandId, []);
    bandCells.get(cell.priceBandId).push(cell);
  }
  const widthInchesById = new Map((data.widthBands ?? []).map((b) => [b.id, b.widthInches]));
  const heightInchesById = new Map((data.heightBands ?? []).map((b) => [b.id, b.heightInches]));
  for (const [bandId, cells] of bandCells) {
    const bandName = (data.priceBands ?? []).find((b) => b.id === bandId)?.name ?? bandId;
    const priceAt = new Map(
      cells.map((c) => [`${widthInchesById.get(c.widthBandId)}x${heightInchesById.get(c.heightBandId)}`, c.price])
    );
    const widths = [...new Set(cells.map((c) => widthInchesById.get(c.widthBandId)))].sort((a, b) => a - b);
    for (const cell of cells) {
      const w = widthInchesById.get(cell.widthBandId);
      const h = heightInchesById.get(cell.heightBandId);
      // Compare with the immediate lower width at the same height when present.
      const idx = widths.indexOf(w);
      if (idx > 0) {
        const leftPrice = priceAt.get(`${widths[idx - 1]}x${h}`);
        if (Number.isFinite(leftPrice) && cell.price < leftPrice * 0.6) {
          warnings.push(
            `Suspicious price cell in "${bandName}" at ${w}"x${h}": ${cell.price} is far below left neighbor ${leftPrice} (possible corrupted value)`
          );
        }
      }
    }
  }

  for (const band of data.priceBands ?? []) {
    const cells = (data.priceCells ?? []).filter((cell) => cell.priceBandId === band.id);
    if (cells.length === 0) {
      errors.push(`Price band "${band.name}" has no price cells`);
      continue;
    }

    const widthIds = new Set(cells.map((cell) => cell.widthBandId));
    const heightIds = new Set(cells.map((cell) => cell.heightBandId));
    const expected = widthIds.size * heightIds.size;
    if (cells.length !== expected) {
      errors.push(`Price band "${band.name}" has ${cells.length} cells; expected ${expected}`);
    }
  }

  if (data.checksum) {
    const actualChecksum = checksumPricingData(data);
    if (actualChecksum !== data.checksum) {
      errors.push(`Checksum mismatch: expected ${data.checksum}, got ${actualChecksum}`);
    }
  } else if (options.requireChecksum) {
    errors.push('Missing checksum');
  } else {
    warnings.push('Missing checksum');
  }

  return { errors, warnings };
}

export function pricingSummary(data) {
  return {
    generatedAt: data.generatedAt,
    source: data.source,
    checksum: data.checksum,
    counts: {
      priceBands: data.priceBands.length,
      widthBands: data.widthBands.length,
      heightBands: data.heightBands.length,
      priceCells: data.priceCells.length,
      customizationOptions: data.customizationOptions.length,
      customizationPricings: data.customizationPricings.length,
    },
    priceBandNames: data.priceBands.map((band) => band.name),
  };
}
