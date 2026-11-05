'use client';

import { useEffect, useState } from 'react';
import { getNextMidnight } from '@/data/promo';
import { SEASONAL_SALE } from '@/data/seasonal';

interface CountdownTimerProps {
  /** Visual style: 'inline' for banners, 'boxed' for standalone blocks. */
  variant?: 'inline' | 'boxed';
  className?: string;
  /** Kept inside the timer so it disappears along with an expired countdown. */
  label?: string;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeParts | null {
  const deadline = SEASONAL_SALE ? new Date(SEASONAL_SALE.endsAt) : getNextMidnight();
  const diff = deadline.getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: SEASONAL_SALE ? Math.floor((totalSeconds % 86400) / 3600) : Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, '0');

const CountdownTimer = ({ variant = 'inline', className = '', label }: CountdownTimerProps) => {
  // Start null so server and first client render match (avoids a hydration
  // mismatch); the interval callback fills it in immediately after mount, so state
  // is only ever set from the async tick, never synchronously in the effect body.
  const [time, setTime] = useState<TimeParts | null>(null);

  useEffect(() => {
    const tick = () => setTime(getTimeLeft());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  if (variant === 'boxed') {
    const cell = (value: number, label: string) => (
      <div className="flex flex-col items-center">
        <span
          className={`min-w-[2.5rem] rounded-md px-2 py-1.5 text-lg font-bold tabular-nums text-white md:text-xl ${
            SEASONAL_SALE ? 'bg-seasonal-dark' : 'bg-[#00473c]'
          }`}
        >
          {pad(value)}
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#4d6b65]">
          {label}
        </span>
      </div>
    );

    const separator = (
      <span className={`pb-4 text-lg font-bold ${SEASONAL_SALE ? 'text-seasonal-dark' : 'text-[#00473c]'}`}>:</span>
    );

    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {label && <span className="text-xs font-medium text-[#00473c]">{label}</span>}
        <div className="flex items-center gap-2" role="timer" aria-label={label ?? 'Time remaining'}>
          {SEASONAL_SALE && cell(time.days, 'Days')}
          {SEASONAL_SALE && separator}
          {cell(time.hours, 'Hours')}
          {separator}
          {cell(time.minutes, 'Mins')}
          {separator}
          {cell(time.seconds, 'Secs')}
        </div>
      </div>
    );
  }

  // inline
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap font-semibold tabular-nums ${className}`}>
      {label && <span className="font-normal">{label}</span>}
      <span role="timer" aria-label={label ?? 'Time remaining'}>
        {SEASONAL_SALE && `${time.days}d `}{pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    </span>
  );
};

export default CountdownTimer;
