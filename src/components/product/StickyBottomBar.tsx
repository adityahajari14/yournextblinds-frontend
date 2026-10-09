'use client';

import { formatPrice, formatPriceWithCurrency } from '@/lib/api';

interface StickyBottomBarProps {
  price: number;
  additionalCost: number;
  compareAtPrice?: number;
  currency?: string;
  disabled?: boolean;
  isBusy?: boolean;
  onAddToCartClick: () => void;
  onBuyClick: () => void;
  // Desktop is hidden by default (the inline CTA covers it); set true once
  // the inline buttons have scrolled out of view.
  showOnDesktop?: boolean;
}

const StickyBottomBar = ({
  price,
  additionalCost,
  compareAtPrice,
  currency = 'USD',
  disabled = false,
  isBusy = false,
  onAddToCartClick,
  onBuyClick,
  showOnDesktop = false,
}: StickyBottomBarProps) => {
  const totalPrice = price + additionalCost;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[#e0e0e0] bg-white px-4 pt-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] ${showOnDesktop ? '' : 'lg:hidden'}`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-3">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[11px] text-[#666]">From</span>
          <div className="flex flex-wrap items-baseline gap-1.5">
            {compareAtPrice != null && compareAtPrice > totalPrice && (
              <span className="truncate text-sm font-medium text-gray-400 line-through">
                {formatPriceWithCurrency(formatPrice(compareAtPrice), currency)}
              </span>
            )}
            <span className="truncate text-xl font-bold text-[#3a3a3a] md:text-2xl">
              {formatPriceWithCurrency(formatPrice(totalPrice), currency)}
            </span>
          </div>
        </div>
        <div className="ml-auto flex flex-1 gap-2 lg:max-w-md">
          <button
            onClick={onAddToCartClick}
            disabled={disabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
              disabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'border border-[#00473c] text-[#00473c] hover:bg-[#f0fdf9]'
            }`}
          >
            Add to Cart
          </button>
          <button
            onClick={onBuyClick}
            disabled={disabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
              disabled
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-[#00473c] text-white hover:bg-[#003a31]'
            }`}
          >
            {isBusy ? 'Please wait…' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyBottomBar;
