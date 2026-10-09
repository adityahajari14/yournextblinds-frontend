function addWorkingDays(from: Date, workingDays: number): Date {
  const result = new Date(from);
  let remaining = workingDays;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return result;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Renders an estimated dispatch date range (e.g. "Aug 27 - Sep 2") by adding
 * the given working-day range to today, skipping weekends.
 */
export function getEstimatedDispatchDateRange(minWorkingDays: number, maxWorkingDays: number): string {
  const today = new Date();
  const start = addWorkingDays(today, minWorkingDays);
  const end = addWorkingDays(today, maxWorkingDays);

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = sameMonth
    ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : formatShortDate(start);
  const endLabel = formatShortDate(end);

  return `${startLabel} - ${endLabel}`;
}
