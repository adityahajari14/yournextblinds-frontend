// Presentational primitives shared by the admin dashboards. Server components —
// no client boundary needed.

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const number = new Intl.NumberFormat('en-US');

export type Tone = 'success' | 'critical' | 'attention' | 'info' | 'default';

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()}`;
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function formatPercent(ratio: number | null, digits = 1): string {
  if (ratio === null || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const tones: Record<Tone, string> = {
    success: 'bg-[#cdfee1] text-[#0c5132]',
    critical: 'bg-[#fed1cf] text-[#8e1f0b]',
    attention: 'bg-[#ffd6a4] text-[#5e4200]',
    info: 'bg-[#eaf4ff] text-[#00527c]',
    default: 'bg-[#e3e3e3] text-[#303030]',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] px-4 py-3.5 flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#616161] underline decoration-dotted decoration-[#c9c9c9] underline-offset-4 w-fit">
        {label}
      </span>
      <span className="text-[20px] font-semibold text-[#202223] leading-7">{value}</span>
      {sub && <span className="text-xs text-[#6d7175]">{sub}</span>}
    </div>
  );
}

/** Proportional bar row — used for the conversion funnel and the engagement
 *  distribution/trend charts, so neither page needs a charting library. */
export function BarRow({
  label,
  count,
  maxCount,
  rate,
  labelWidth = 'w-40',
  formatted,
}: {
  label: string;
  count: number;
  maxCount: number;
  rate: string | null;
  labelWidth?: string;
  formatted?: string;
}) {
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className={`${labelWidth} shrink-0 text-[13px] text-[#303030]`}>{label}</span>
      <div className="flex-1 h-6 bg-[#f1f1f1] rounded overflow-hidden">
        <div className="h-full bg-[#0b6bcb] rounded" style={{ width: `${width}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right text-[13px] font-semibold text-[#202223]">
        {formatted ?? number.format(count)}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-[#6d7175]">{rate ?? '—'}</span>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e3e3e3] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[#202223]">{title}</h2>
          {subtitle && <p className="text-xs text-[#6d7175] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-xs font-medium text-[#6d7175] ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-[#6d7175]">
        {children}
      </td>
    </tr>
  );
}

export function AdminNav({ current }: { current: 'store' | 'engagement' }) {
  const links = [
    { key: 'store', href: '/admin/abandoned-checkouts', label: 'Carts & checkouts' },
    { key: 'engagement', href: '/admin/analytics', label: 'Engagement' },
  ] as const;

  return (
    <div className="flex gap-1">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
            link.key === current ? 'bg-[#202223] text-white' : 'bg-white text-[#6d7175] hover:text-[#202223]'
          }`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
