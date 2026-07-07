'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PROMO_CODE, PROMO_HEADLINE, PROMO_CODE_PERCENT } from '@/data/promo';
import CountdownTimer from '@/components/common/CountdownTimer';

const PromoBar = () => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(PROMO_CODE).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  };

  return (
    <div className="bg-[#00473c] text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-1.5 px-4 py-2 text-center sm:flex-row sm:gap-3 sm:py-2.5">
        <Link href="/collections" className="text-xs font-semibold tracking-wide hover:underline sm:text-sm">
          {PROMO_HEADLINE} — Extra {PROMO_CODE_PERCENT}% off
        </Link>

        <span className="hidden text-white/40 sm:inline">|</span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80">Code:</span>
          <button
            type="button"
            onClick={copyCode}
            className="rounded border border-dashed border-white/50 bg-white/10 px-2 py-0.5 text-xs font-bold tracking-wider transition-colors hover:bg-white/20"
            aria-label={`Copy code ${PROMO_CODE}`}
            title="Click to copy"
          >
            {copied ? 'Copied!' : PROMO_CODE}
          </button>
        </div>

        <span className="hidden text-white/40 sm:inline">|</span>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-white/80">Ends in</span>
          <CountdownTimer variant="inline" className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default PromoBar;
