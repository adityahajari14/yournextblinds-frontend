'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PROMO_CODE, PROMO_CODE_PERCENT, SALE_MAX_PERCENT } from '@/data/promo';
import { SEASONAL_SALE } from '@/data/seasonal';
import CountdownTimer from '@/components/common/CountdownTimer';
import { PumpkinIcon } from '@/components/seasonal';

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
    <div className={`${SEASONAL_SALE ? 'bg-seasonal-dark' : 'bg-[#00473c]'} text-white`}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-4 py-2 text-center sm:gap-x-3 sm:py-2.5 lg:flex-nowrap lg:text-left">
        {SEASONAL_SALE ? (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold tracking-wide text-seasonal-accent sm:text-sm">
            <PumpkinIcon className="h-4 w-4 shrink-0" />
            {SEASONAL_SALE.saleName.toUpperCase()}: UP TO {SALE_MAX_PERCENT}% OFF
          </span>
        ) : (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold tracking-wide sm:text-sm">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l7.414 7.414a1 1 0 010 1.414l-8.586 8.586a1 1 0 01-1.414 0l-7.414-7.414A1 1 0 013 12.586V7a4 4 0 014-4z" />
            </svg>
            UP TO {SALE_MAX_PERCENT}% OFF
          </span>
        )}

        <span className="hidden text-white/40 sm:inline">|</span>

        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm">
          Extra {PROMO_CODE_PERCENT}% Off with code
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1 rounded border border-white/50 bg-white/10 px-1.5 py-0.5 text-xs font-bold tracking-wider transition-colors hover:bg-white/20"
            aria-label={`Copy code ${PROMO_CODE}`}
            title="Click to copy"
          >
            {copied ? 'Copied!' : PROMO_CODE}
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </span>

        <span className="hidden text-white/40 sm:inline">|</span>

        <span className="hidden whitespace-nowrap text-xs sm:inline sm:text-sm">Today Only</span>

        <span className="hidden text-white/40 sm:inline">|</span>

        <span className="hidden whitespace-nowrap text-xs sm:inline sm:text-sm">While Supplies Last</span>

        <span className="hidden text-white/40 sm:inline">|</span>

        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sale ends in <CountdownTimer variant="inline" className="text-white" />
        </span>

        <Link
          href="/collections"
          className={`ml-1 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold tracking-wide transition-colors sm:text-sm ${
            SEASONAL_SALE
              ? 'bg-seasonal-accent text-seasonal-dark hover:bg-white'
              : 'bg-white text-[#00473c] hover:bg-gray-100'
          }`}
        >
          SHOP NOW
        </Link>
      </div>
    </div>
  );
};

export default PromoBar;
