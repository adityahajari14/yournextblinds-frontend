"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESET_RANGES = [7, 30, 90] as const;

export default function AnalyticsFilterBar({
  devices,
  sources,
}: {
  devices: string[];
  sources: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  const currentRange = searchParams.get("range");
  const currentDevice = searchParams.get("device") || "";
  const currentSource = searchParams.get("source") || "";
  const hasCustomDates = Boolean(searchParams.get("from") && searchParams.get("to"));

  const navigate = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Any filter change invalidates the current page cursor.
    params.delete("sessionPage");

    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.push(`/admin/analytics?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(hasCustomDates || currentDevice || currentSource);

  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] p-4 flex flex-wrap items-end gap-3">
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
          onClick={() => from && to && navigate({ from, to, range: undefined })}
          disabled={!from || !to}
          className="rounded-lg border border-[#c9cccf] bg-white px-3 py-1.5 text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Apply dates
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[#6d7175]">Device</label>
        <select
          value={currentDevice}
          onChange={(e) => navigate({ device: e.target.value || undefined })}
          className="w-36 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030] bg-white"
        >
          <option value="">All devices</option>
          {devices.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[#6d7175]">Source</label>
        <select
          value={currentSource}
          onChange={(e) => navigate({ source: e.target.value || undefined })}
          className="w-44 rounded-lg border border-[#c9cccf] px-2.5 py-1.5 text-[13px] text-[#202223] outline-none focus:border-[#303030] bg-white"
        >
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setFrom("");
            setTo("");
            navigate({ from: undefined, to: undefined, device: undefined, source: undefined, range: "30" });
          }}
          className="rounded-lg border border-[#c9cccf] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#6d7175] hover:text-[#202223] transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
