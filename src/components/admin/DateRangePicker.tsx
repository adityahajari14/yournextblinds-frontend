'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PRESETS: { key: string; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
  { key: 'all', label: 'All time' },
];

export default function DateRangePicker({
  activeRange,
  activeLabel,
}: {
  activeRange: string;
  activeLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyPreset = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', key);
    params.delete('start');
    params.delete('end');
    setOpen(false);
    router.push(`/admin/analytics?${params.toString()}`);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', 'custom');
    params.set('start', customStart);
    params.set('end', customEnd);
    setOpen(false);
    router.push(`/admin/analytics?${params.toString()}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#3a3a3a] hover:border-[#00473c]"
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {activeLabel}
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <ul className="space-y-0.5">
            {PRESETS.map((preset) => (
              <li key={preset.key}>
                <button
                  onClick={() => applyPreset(preset.key)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    activeRange === preset.key ? 'font-semibold text-[#00473c]' : 'text-[#3a3a3a]'
                  }`}
                >
                  {preset.label}
                  {activeRange === preset.key && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-gray-100 pt-2">
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Custom range</p>
            <div className="flex flex-col gap-2 px-3 py-1">
              <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
                From
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
                To
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                onClick={applyCustom}
                disabled={!customStart || !customEnd}
                className="mt-1 rounded-md bg-[#00473c] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#003830] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
