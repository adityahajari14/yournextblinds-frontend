'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSamples } from '@/context/SampleContext';
import { useAuth } from '@/context/AuthContext';
import { SampleCategory, SampleProduct, SampleVariantOption } from '@/types';
import { MAX_FREE_SAMPLES } from '@/data/samples';
import { track } from '@/lib/track';

interface SampleBrowserProps {
  /** Sample-eligible products grouped by category (built server-side). */
  categories: SampleCategory[];
}

const FALLBACK_IMG = '/home/products/vertical-blinds-1.jpg';

const SampleBrowser = ({ categories }: SampleBrowserProps) => {
  const { samples, count, isFull, addSample, removeSample, isInBasket, clearSamples } = useSamples();
  const { customer } = useAuth();

  // Stepped navigation: pick a category, then a product, then variants (if any).
  const [activeCategory, setActiveCategory] = useState<SampleCategory | null>(null);
  const [activeProduct, setActiveProduct] = useState<SampleProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestSamples = async () => {
    if (count === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/samples/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customer?.email || undefined,
          swatches: samples.map((s) => ({
            productHandle: s.productHandle,
            variantId: s.variantId,
            colorName: s.colorName,
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message || 'Failed to start sample checkout');
      }

      // Clear the basket, then hand off to Shopify's hosted checkout — same as a
      // normal order. The $0 total means no payment is taken; the completed order
      // then shows in the customer's Shopify account.
      track('sample_request', { sampleCount: count });
      clearSamples();
      window.location.href = json.data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const addSwatch = (product: SampleProduct, variant: SampleVariantOption) => {
    addSample({
      productHandle: product.handle,
      productTitle: product.title,
      variantId: variant.variantId,
      colorName: variant.label,
      swatchImage: variant.image,
    });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Stepper column */}
      <div className="flex-1">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => {
              setActiveCategory(null);
              setActiveProduct(null);
            }}
            className={`font-medium ${activeCategory ? 'text-[#00473c] hover:underline' : 'text-gray-400'}`}
          >
            All Categories
          </button>
          {activeCategory && (
            <>
              <span className="text-gray-300">/</span>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className={`font-medium ${activeProduct ? 'text-[#00473c] hover:underline' : 'text-gray-400'}`}
              >
                {activeCategory.name}
              </button>
            </>
          )}
          {activeProduct && (
            <>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-400">{activeProduct.title}</span>
            </>
          )}
        </nav>

        {/* Step 1: Categories */}
        {!activeCategory && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => setActiveCategory(category)}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square w-full bg-gray-50">
                  <Image
                    src={category.products[0]?.image || FALLBACK_IMG}
                    alt={category.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[#1f1f1f]">{category.name}</p>
                  <p className="text-xs text-gray-500">
                    {category.productCount} product{category.productCount === 1 ? '' : 's'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Products within category */}
        {activeCategory && !activeProduct && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {activeCategory.products.map((product) => {
              // A no-variant product can be added directly from the product grid.
              const soleVariant = !product.hasVariants ? product.variants[0] : null;
              const inBasket = soleVariant ? isInBasket(soleVariant.variantId) : false;
              const disabled = Boolean(soleVariant) && !inBasket && isFull;

              return (
                <div
                  key={product.handle}
                  className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => product.hasVariants && setActiveProduct(product)}
                    className={`relative aspect-square w-full bg-gray-50 ${
                      product.hasVariants ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <Image
                      src={product.image || FALLBACK_IMG}
                      alt={product.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {product.hasVariants && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#00473c]">
                        {product.variants.length} colours
                      </span>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="truncate text-sm font-semibold text-[#1f1f1f]" title={product.title}>
                      {product.title}
                    </p>
                    {product.hasVariants ? (
                      <button
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="mt-auto rounded-md border border-[#00473c] bg-white px-3 py-2 text-xs font-semibold text-[#00473c] transition-colors hover:bg-[#f6fffd]"
                      >
                        Choose Colour
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          inBasket
                            ? removeSample(soleVariant!.variantId)
                            : addSwatch(product, soleVariant!)
                        }
                        disabled={disabled}
                        className={`mt-auto rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                          inBasket
                            ? 'border-[#00473c] bg-[#00473c] text-white hover:bg-[#003830]'
                            : disabled
                              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                              : 'border-[#00473c] bg-white text-[#00473c] hover:bg-[#f6fffd]'
                        }`}
                      >
                        {inBasket ? '✓ Added' : disabled ? 'Basket full' : 'Add Free Sample'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 3: Variants within product */}
        {activeProduct && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {activeProduct.variants.map((variant) => {
              const inBasket = isInBasket(variant.variantId);
              const disabled = !inBasket && isFull;

              return (
                <div
                  key={variant.variantId}
                  className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="relative aspect-square w-full bg-gray-50">
                    <Image
                      src={variant.image || FALLBACK_IMG}
                      alt={variant.label}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="truncate text-sm font-semibold text-[#1f1f1f]" title={variant.label}>
                      {variant.label}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        inBasket ? removeSample(variant.variantId) : addSwatch(activeProduct, variant)
                      }
                      disabled={disabled}
                      className={`mt-auto rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                        inBasket
                          ? 'border-[#00473c] bg-[#00473c] text-white hover:bg-[#003830]'
                          : disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                            : 'border-[#00473c] bg-white text-[#00473c] hover:bg-[#f6fffd]'
                      }`}
                    >
                      {inBasket ? '✓ Added' : disabled ? 'Basket full' : 'Add Free Sample'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Basket summary */}
      <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f1f1f]">Your Samples</h2>
            <span className="text-sm font-medium text-[#00473c]">
              {count} of {MAX_FREE_SAMPLES}
            </span>
          </div>

          {count === 0 ? (
            <p className="text-sm text-gray-500">
              No samples selected yet. Add up to {MAX_FREE_SAMPLES} free swatches.
            </p>
          ) : (
            <>
              <ul className="mb-4 flex max-h-72 flex-col gap-3 overflow-y-auto">
                {samples.map((s) => (
                  <li key={s.variantId} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-50">
                      <Image
                        src={s.swatchImage || FALLBACK_IMG}
                        alt={s.colorName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1f1f1f]">{s.colorName}</p>
                      <p className="truncate text-xs text-gray-500">{s.productTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSample(s.variantId)}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${s.colorName}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              {isFull && (
                <p className="mb-3 rounded bg-[#f6fffd] px-3 py-2 text-xs text-[#00473c]">
                  You&apos;ve reached the {MAX_FREE_SAMPLES}-sample limit.
                </p>
              )}

              {error && (
                <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <button
                type="button"
                onClick={handleRequestSamples}
                disabled={submitting}
                className="block w-full rounded-md bg-[#00473c] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#003830] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Starting checkout…' : 'Continue to Checkout'}
              </button>
              <button
                type="button"
                onClick={clearSamples}
                disabled={submitting}
                className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 disabled:opacity-60"
              >
                Clear all
              </button>
            </>
          )}

          <p className="mt-4 text-xs leading-relaxed text-gray-400">
            Free samples are delivered straight to your mailbox — no payment, no signature required.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default SampleBrowser;
