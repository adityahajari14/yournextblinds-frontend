"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ExportButton({ type, status }: { type: "checkouts" | "carts"; status: string }) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", type);
      if (status !== "all") {
        params.set("status", status);
      } else {
        params.delete("status");
      }

      const response = await fetch(`/api/admin/export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-${Date.now()}.csv`;
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
      className="px-3 py-1.5 rounded-lg border border-[#c9cccf] bg-white text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-50 transition-colors"
    >
      {isExporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
