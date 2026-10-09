/** Upper bound on rows in any single export, so a wide date range can't stall
 *  the function or produce a download nothing can open. */
export const EXPORT_ROW_LIMIT = 5_000;

/**
 * ISO 8601 for timestamps. The Postgres driver hands back Date objects, and
 * their default string form ("Wed Aug 12 2026 23:06:08 GMT+0530 (India
 * Standard Time)") is locale-dependent and won't parse as a date in Excel or
 * Sheets.
 */
export function csvDate(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${Date.now()}.csv"`,
    },
  });
}
