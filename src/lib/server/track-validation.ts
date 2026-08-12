// Shared clamps for the public, unauthenticated tracking endpoints. Every field
// coming off the wire is attacker-controlled, so nothing reaches the database
// without being bounded here first.
export const MAX_TEXT_LENGTH = 200;
export const MAX_USER_AGENT_LENGTH = 500;
export const MAX_REFERRER_LENGTH = 500;
export const MAX_JSON_BYTES = 4_000;

const DEVICE_TYPES = new Set(['desktop', 'mobile', 'tablet']);

export function clampText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function clampNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Whole number clamped into [0, max]; anything else becomes null. */
export function clampInt(value: unknown, max: number): number | null {
  const parsed = clampNumber(value);
  if (parsed === null) return null;
  return Math.min(Math.round(parsed), max);
}

export function clampJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const serialized = JSON.stringify(value);
  return serialized.length <= MAX_JSON_BYTES ? (value as Record<string, unknown>) : null;
}

export function clampDeviceType(value: unknown): string | null {
  const text = clampText(value);
  return text && DEVICE_TYPES.has(text) ? text : null;
}

/**
 * Normalises a URL path for aggregation: strips query string and hash (which
 * carry UTM params and would otherwise explode the cardinality of the
 * "time by page" report), drops a trailing slash, and enforces a leading one.
 */
export function clampPath(value: unknown): string | null {
  const raw = clampText(value, MAX_TEXT_LENGTH);
  if (!raw) return null;

  const withoutQuery = raw.split(/[?#]/)[0];
  if (!withoutQuery.startsWith('/')) return null;

  const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
  return trimmed || '/';
}
