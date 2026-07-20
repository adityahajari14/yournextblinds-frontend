'use client';

// Self-contained SVG charts for the analytics dashboard. No external libraries.
// Palette follows the store brand (green primary) with the dataviz method's
// structure: hairline gridlines, recessive axes, tabular figures, a 2px line,
// rounded data-ends, and an emphasized endpoint.

export interface Point {
  bucket: string;
  value: number;
}

const INK = '#0b0b0b';
const MUTED = '#898781';
const GRID = '#e1e0d9';
const BRAND = '#00473c';
const BRAND_SOFT = 'rgba(0, 71, 60, 0.10)';

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

/** Compact inline sparkline for metric cards. */
export function Sparkline({ data, color = BRAND }: { data: Point[]; color?: string }) {
  if (data.length < 2) {
    return <div className="h-8" aria-hidden="true" />;
  }
  const w = 120;
  const h = 32;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d.value - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <path d={area} fill={BRAND_SOFT} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

function formatBy(n: number, kind: 'number' | 'currency'): string {
  if (kind === 'currency') {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return n.toLocaleString('en-US');
}

/** Full time-series line chart with optional second series. */
export function LineChart({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  valueFormat = 'number',
  height = 260,
}: {
  primary: Point[];
  secondary?: Point[];
  primaryLabel: string;
  secondaryLabel?: string;
  /** Serializable format kind (functions can't cross the server→client boundary). */
  valueFormat?: 'number' | 'currency';
  height?: number;
}) {
  if (primary.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        Not enough data to chart yet.
      </div>
    );
  }

  const padL = 44;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const vw = 720;
  const plotW = vw - padL - padR;
  const plotH = height - padT - padB;

  const allValues = [...primary, ...(secondary ?? [])].map((d) => d.value);
  const rawMax = Math.max(...allValues, 1);
  const max = niceMax(rawMax);
  const n = primary.length;
  const step = plotW / (n - 1);

  const toXY = (d: Point, i: number) => {
    const x = padL + i * step;
    const y = padT + plotH - (d.value / max) * plotH;
    return [x, y] as const;
  };

  const pathOf = (data: Point[]) =>
    data
      .map((d, i) => {
        const [x, y] = toXY(d, i);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const primaryPath = pathOf(primary);
  const primaryArea = `${primaryPath} L${(padL + (n - 1) * step).toFixed(1)},${padT + plotH} L${padL},${padT + plotH} Z`;

  // Y gridlines
  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (max / yTicks) * i;
    const y = padT + plotH - (val / max) * plotH;
    return { y, val };
  });

  // X labels: show ~6 evenly spaced
  const xLabelEvery = Math.max(1, Math.ceil(n / 6));
  const fmtBucket = (b: string) => {
    // b is "YYYY-MM-DD" or "YYYY-MM-DDTHH:00"
    const dPart = b.slice(0, 10);
    const parts = dPart.split('-');
    if (parts.length !== 3) return b;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[Number(parts[1]) - 1]} ${Number(parts[2])}`;
    return b.includes('T') ? `${label} ${b.slice(11, 16)}` : label;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${vw} ${height}`} width="100%" className="min-w-[560px]" role="img" aria-label={`${primaryLabel} over time`}>
        {/* gridlines + y labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={vw - padR} y2={g.y} stroke={GRID} strokeWidth={1} />
            <text x={padL - 8} y={g.y + 4} textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatShort(g.val)}
            </text>
          </g>
        ))}
        {/* x labels */}
        {primary.map((d, i) =>
          i % xLabelEvery === 0 || i === n - 1 ? (
            <text
              key={i}
              x={padL + i * step}
              y={height - 8}
              textAnchor="middle"
              fontSize={11}
              fill={MUTED}
            >
              {fmtBucket(d.bucket)}
            </text>
          ) : null
        )}
        {/* primary area + line */}
        <path d={primaryArea} fill={BRAND_SOFT} />
        <path d={primaryPath} fill="none" stroke={BRAND} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* secondary line (dashed) */}
        {secondary && secondary.length === n && (
          <path d={pathOf(secondary)} fill="none" stroke={MUTED} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />
        )}
        {/* endpoint emphasis */}
        {(() => {
          const [x, y] = toXY(primary[n - 1], n - 1);
          return <circle cx={x} cy={y} r={3} fill={BRAND} />;
        })()}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 pl-11 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full" style={{ background: BRAND }} />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: MUTED }} />
            {secondaryLabel}
          </span>
        )}
        <span className="ml-auto tabular-nums" style={{ color: INK }}>
          {formatBy(primary.reduce((s, d) => s + d.value, 0), valueFormat)} total
        </span>
      </div>
    </div>
  );
}

/** Horizontal bar list for breakdowns (source / device / country / landing). */
export function BarList({
  rows,
  valueLabel = 'sessions',
}: {
  rows: { label: string; sessions: number; share: number }[];
  valueLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No data in this period.</p>;
  }
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-[#3a3a3a]" title={r.label}>
            {r.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100">
            <div
              className="h-full rounded"
              style={{ width: `${Math.max((r.sessions / max) * 100, 2)}%`, background: BRAND }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-sm tabular-nums text-gray-600">
            {r.sessions.toLocaleString()}
            <span className="ml-1 text-xs text-gray-400">{(r.share * 100).toFixed(0)}%</span>
          </span>
        </div>
      ))}
      <p className="pt-1 text-[11px] uppercase tracking-wide text-gray-400">by {valueLabel}</p>
    </div>
  );
}

/** Funnel bars with stage-to-stage conversion. */
export function FunnelChart({
  stages,
}: {
  stages: { key: string; label: string; count: number; fromPrevious: number | null; fromTop: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-3">
      {stages.map((s) => (
        <div key={s.key}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-[#3a3a3a]">{s.label}</span>
            <span className="tabular-nums text-gray-500">
              {s.count.toLocaleString()}
              {s.fromPrevious !== null && (
                <span className="ml-2 text-xs text-gray-400">{(s.fromPrevious * 100).toFixed(1)}% of prev</span>
              )}
            </span>
          </div>
          <div className="h-6 overflow-hidden rounded bg-gray-100">
            <div
              className="flex h-full items-center rounded pl-2 text-[11px] font-medium text-white"
              style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 4 : 0)}%`, background: BRAND }}
            >
              {s.fromTop > 0 && s.count / max > 0.12 ? `${(s.fromTop * 100).toFixed(0)}%` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
