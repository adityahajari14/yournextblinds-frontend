'use client';

import { useEffect, useState } from 'react';
import { getNextMidnight } from '@/data/promo';

interface CountdownTimerProps {
  /** Visual style: 'inline' for banners, 'boxed' for standalone blocks. */
  variant?: 'inline' | 'boxed';
  className?: string;
}

interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeParts {
  const diff = Math.max(0, getNextMidnight().getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n: number) => n.toString().padStart(2, '0');

const CountdownTimer = ({ variant = 'inline', className = '' }: CountdownTimerProps) => {
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
        <span className="min-w-[2.5rem] rounded-md bg-[#00473c] px-2 py-1.5 text-lg font-bold tabular-nums text-white md:text-xl">
          {pad(value)}
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#4d6b65]">
          {label}
        </span>
      </div>
    );

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {cell(time.hours, 'Hours')}
        <span className="pb-4 text-lg font-bold text-[#00473c]">:</span>
        {cell(time.minutes, 'Mins')}
        <span className="pb-4 text-lg font-bold text-[#00473c]">:</span>
        {cell(time.seconds, 'Secs')}
      </div>
    );
  }

  // inline
  return (
    <span className={`font-semibold tabular-nums ${className}`}>
      {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
    </span>
  );
};

export default CountdownTimer;
