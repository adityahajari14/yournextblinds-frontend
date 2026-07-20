import { Sparkline, Point } from './charts';

interface MetricCardProps {
  label: string;
  value: number;
  deltaPct: number | null;
  series?: Point[];
  format?: 'number' | 'currency' | 'percent';
  /** For metrics where a decrease is good (e.g. checkout errors). */
  invertDelta?: boolean;
  compact?: boolean;
}

function formatValue(value: number, format: MetricCardProps['format']): string {
  if (format === 'currency') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === 'percent') {
    return `${(value * 100).toFixed(2)}%`;
  }
  return value.toLocaleString('en-US');
}

export default function MetricCard({
  label,
  value,
  deltaPct,
  series,
  format = 'number',
  invertDelta = false,
  compact = false,
}: MetricCardProps) {
  const hasDelta = deltaPct !== null;
  const isUp = (deltaPct ?? 0) >= 0;
  // Green when the movement is favorable, red when not.
  const favorable = invertDelta ? !isUp : isUp;
  const deltaColor = !hasDelta ? 'text-gray-400' : favorable ? 'text-green-700' : 'text-red-600';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums text-[#1a1a1a]">{formatValue(value, format)}</p>
        {!compact && series && series.length > 1 && (
          <div className="pb-1">
            <Sparkline data={series} />
          </div>
        )}
      </div>
      <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
        {hasDelta ? (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d={isUp ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
              />
            </svg>
            {Math.abs(deltaPct * 100).toFixed(1)}%
            <span className="font-normal text-gray-400">vs previous</span>
          </>
        ) : (
          <span className="text-gray-400">— no prior data</span>
        )}
      </div>
    </div>
  );
}
