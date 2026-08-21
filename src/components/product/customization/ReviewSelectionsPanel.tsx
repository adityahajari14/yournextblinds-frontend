'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { formatPrice, formatPriceWithCurrency } from '@/lib/api';

interface ReviewSelectionsPanelProps {
  colorName: string | null;
  colorImage: string | null;
  measurementsLabel: string | null;
  installationMethodName: string | null;
  controlOptionName: string | null;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAddingToCart: boolean;
  isBuyingNow: boolean;
  buyNowError?: string | null;
}

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-[#3a3a3a] text-right">{value}</span>
  </div>
);

const ReviewSelectionsPanel = ({
  colorName,
  colorImage,
  measurementsLabel,
  installationMethodName,
  controlOptionName,
  price,
  compareAtPrice,
  currency = 'USD',
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isAddingToCart,
  isBuyingNow,
  buyNowError,
}: ReviewSelectionsPanelProps) => {
  const subtotal = price * quantity;
  const isBusy = isAddingToCart || isBuyingNow;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h3 className="text-lg font-semibold text-[#1f1f1f]">Review Your Selections</h3>

      <div className="mt-3 divide-y divide-gray-200/70">
        <Row
          label="Color"
          value={
            <span className="inline-flex items-center gap-2">
              {colorName ?? 'Not selected'}
              {colorImage && (
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                  <Image src={colorImage} alt={colorName ?? 'Selected color'} fill className="object-cover" unoptimized />
                </span>
              )}
            </span>
          }
        />
        <Row label="Measurements" value={measurementsLabel ?? 'Not entered'} />
        <Row label="Installation Method" value={installationMethodName ?? 'Not selected'} />
        <Row label="Control Option" value={controlOptionName ?? 'Not selected'} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-300 pt-4">
        <span className="text-base font-semibold text-[#1f1f1f]">Subtotal</span>
        <span className="flex items-baseline gap-2">
          {compareAtPrice != null && compareAtPrice > subtotal && (
            <span className="text-sm font-medium text-gray-400 line-through">
              {formatPriceWithCurrency(formatPrice(compareAtPrice * quantity), currency)}
            </span>
          )}
          <span className="text-xl font-bold text-[#1f1f1f]">
            {formatPriceWithCurrency(formatPrice(subtotal), currency)}
          </span>
        </span>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="px-4 py-2.5 text-sm font-medium min-w-[40px] text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            disabled={quantity >= 99}
            className="px-3 py-2.5 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <button
          onClick={onAddToCart}
          disabled={isBusy}
          className={`flex-1 py-2.5 md:py-3 px-4 md:px-6 rounded-lg text-sm md:text-base font-medium transition-colors ${
            isBusy ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#00473c] text-white hover:bg-[#003830]'
          }`}
        >
          {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
        </button>
        <button
          onClick={onBuyNow}
          disabled={isBusy}
          className={`flex-1 py-2.5 md:py-3 px-4 md:px-6 rounded-lg text-sm md:text-base font-medium transition-colors border ${
            isBusy
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-[#00473c] text-[#00473c] hover:bg-[#f0fdf9]'
          }`}
        >
          {isBuyingNow ? 'Preparing Checkout...' : 'Buy Now'}
        </button>
      </div>

      {buyNowError && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-medium text-red-800">{buyNowError}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSelectionsPanel;
