'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PROMO_CODE, PROMO_HEADLINE, PROMO_CODE_PERCENT } from '@/data/promo';
import { SEASONAL_SALE } from '@/data/seasonal';
import CountdownTimer from '@/components/common/CountdownTimer';
import { BatIcon, CobwebCorner, PumpkinIcon } from '@/components/seasonal';

const FlashSale = () => {
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
    <section className={`relative overflow-hidden ${SEASONAL_SALE ? 'bg-seasonal-dark' : 'bg-[#00473c]'}`}>
      <div className="absolute left-0 top-8 flex flex-col gap-4 w-[306px] -translate-x-1/3 opacity-25 hidden md:flex">
        <div className="h-[43px] bg-white/25" />
        <div className="h-[43px] bg-white/25" />
        <div className="h-[43px] bg-white/25" />
        <div className="h-[43px] bg-white/25" />
      </div>

      {SEASONAL_SALE && (
        <div className="pointer-events-none absolute inset-0 text-seasonal-accent">
          <CobwebCorner className="absolute right-0 top-0 h-24 w-24 -scale-x-100 opacity-30 md:h-40 md:w-40" />
          <BatIcon className="absolute right-[14%] top-10 hidden h-5 w-10 rotate-6 opacity-50 md:block" />
          <BatIcon className="absolute left-[20%] top-16 hidden h-4 w-8 -rotate-12 opacity-35 md:block" />
          <BatIcon className="absolute bottom-10 right-[24%] hidden h-3 w-6 -rotate-6 opacity-30 lg:block" />
        </div>
      )}

      <div className="relative z-10 px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-20 flex flex-col gap-6 md:gap-7 items-center">
        <div className="flex flex-col gap-2 md:gap-3 items-center text-center max-w-[720px]">
          {SEASONAL_SALE && <PumpkinIcon className="h-9 w-9 text-seasonal-accent md:h-11 md:w-11" />}
          <h2 className="text-xl md:text-2xl lg:text-[32px] font-semibold text-white tracking-tight leading-tight">
            {SEASONAL_SALE ? SEASONAL_SALE.sectionHeading : 'OUR BIGGEST FLASH SALE EVER'}
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-white/90 leading-relaxed">
            {PROMO_HEADLINE} + Get an Extra {PROMO_CODE_PERCENT}% Off with code{' '}
            <button
              type="button"
              onClick={copyCode}
              className="rounded border border-dashed border-white/60 bg-white/10 px-2 py-0.5 font-bold tracking-wider transition-colors hover:bg-white/20"
              title="Click to copy"
            >
              {copied ? 'Copied!' : PROMO_CODE}
            </button>
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-white/70">
            Hurry — offer ends in
          </span>
          <div className="rounded-lg bg-white/95 px-4 py-3">
            <CountdownTimer variant="boxed" />
          </div>
        </div>

        <Link
          href="/collections"
          className={`w-full md:w-fit px-6 md:px-8 py-3 rounded text-sm md:text-base font-medium tracking-wider transition-colors text-center ${
            SEASONAL_SALE
              ? 'bg-seasonal-accent text-seasonal-dark hover:bg-white'
              : 'bg-white text-[#00473c] hover:bg-gray-100'
          }`}
        >
          {SEASONAL_SALE ? `Shop the ${SEASONAL_SALE.saleName}` : 'Shop the Sale'}
        </Link>
      </div>
    </section>
  );
};

export default FlashSale;
