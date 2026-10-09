"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface ExportButtonProps {
  /** API route to hit; the page's current filters are forwarded as-is. */
  endpoint: string;
  /** Base name for the downloaded file — a timestamp is appended. */
  filename: string;
  label?: string;
  /** Extra query params. A value of `undefined` removes an inherited param. */
  params?: Record<string, string | undefined>;
}

export default function ExportButton({ endpoint, filename, label = "Export CSV", params }: ExportButtonProps) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params ?? {})) {
        if (value === undefined) {
          query.delete(key);
        } else {
          query.set(key, value);
        }
      }

      const response = await fetch(`${endpoint}?${query.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silent — export is a convenience action, not critical path
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="px-3 py-1.5 rounded-lg border border-[#c9cccf] bg-white text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {isExporting ? "Exporting..." : label}
    </button>
  );
}
