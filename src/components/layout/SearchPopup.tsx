'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, formatPriceWithCurrency } from '@/lib/api';
import { track } from '@/lib/track';
import type { SearchSuggestion } from '@/app/api/search/suggestions/route';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

interface SearchPopupProps {
  open: boolean;
  onClose: () => void;
}

const SearchPopup = ({ open, onClose }: SearchPopupProps) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open/close so re-opening the popup always starts fresh.
  useEffect(() => {
    if (open) {
      setQuery('');
      setSuggestions([]);
      setIsLoading(false);
      // Focus after the entrance transition mounts the input.
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Live search-as-you-type: debounced, cancels the previous in-flight
  // request so a fast typist never sees an older query's results flash in.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const json = await response.json();
        if (!controller.signal.aborted) {
          setSuggestions(json.data ?? []);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const goToResultsPage = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    track('search', { query: trimmed, source: 'header_popup' });
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    goToResultsPage(query);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-popup-heading"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="search-popup-heading" className="sr-only">
          Search products
        </h2>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-gray-200 p-4">
          <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products..."
            className="min-w-0 flex-1 text-base text-black placeholder:text-gray-400 focus:outline-none"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[#00473c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00332a]"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < MIN_QUERY_LENGTH ? (
            <p className="p-6 text-center text-sm text-gray-500">Start typing to see live results.</p>
          ) : isLoading ? (
            <p className="p-6 text-center text-sm text-gray-500">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">
              No products found for &quot;{query.trim()}&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {product.image && (
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black capitalize">{product.name}</p>
                      <p className="text-sm font-bold text-black">
                        {formatPriceWithCurrency(formatPrice(product.price), product.currency)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="border-t border-gray-100 p-3">
            <button
              type="button"
              onClick={() => goToResultsPage(query)}
              className="w-full rounded-lg py-2 text-center text-sm font-semibold text-[#00473c] transition-colors hover:bg-[#f0fdf9]"
            >
              See all results for &quot;{query.trim()}&quot;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPopup;
