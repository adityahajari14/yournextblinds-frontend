"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESET_RANGES = [7, 30, 90] as const;

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [product, setProduct] = useState(searchParams.get("product") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  const currentRange = searchParams.get("range");
  const hasCustomDates = Boolean(searchParams.get("from") || searchParams.get("to"));

  const navigate = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.push(`/admin/abandoned-checkouts?${params.toString()}`);
  };

  const applyDateRange = () => {
    if (from && to) {
      navigate({ from, to, range: undefined });
    }
  };

  const applyFilters = () => {
    navigate({
      search: search.trim() || undefined,
      product: product.trim() || undefined,
      minPrice: minPrice.trim() || undefined,
      maxPrice: maxPrice.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setProduct("");
    setMinPrice("");
    setMaxPrice("");
    setFrom("");
    setTo("");
    navigate({
      search: undefined,
      product: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      from: undefined,
      to: undefined,
      range: "30",
    });
  };

  const hasActiveFilters = Boolean(
    searchParams.get("search") ||
      searchParams.get("product") ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice") ||
      hasCustomDates
  );

  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex rounded-lg border border-[#c9cccf] bg-white p-0.5">
          {PRESET_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
                navigate({ range: String(r), from: undefined, to: undefined });
              }}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                !hasCustomDates && String(r) === (currentRange || "30")
                  ? "bg-[#f1f1f1] text-[#202223]"
                  : "text-[#6d7175] hover:text-[#202223]"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#6d7175]">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#6d7175]">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
            />
          </div>
          <button
            type="button"
            onClick={applyDateRange}
            disabled={!from || !to}
            className="rounded-lg border border-[#c9cccf] bg-white px-3 py-1.5 text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply dates
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[#6d7175]">Email / name search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. jane@example.com"
            className="w-48 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[#6d7175]">Product / handle</label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. honeycomb-blackout-blind"
            className="w-56 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[#6d7175]">Min $</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
            className="w-24 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[#6d7175]">Max $</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="1000"
            className="w-24 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030]"
          />
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="rounded-lg bg-[#202223] hover:bg-black px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors"
        >
          Apply filters
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-[#c9cccf] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#6d7175] hover:text-[#202223] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
