"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageParam: string;
}

export default function Pagination({ page, pageSize, total, pageParam }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3e3e3]">
      <span className="text-xs text-[#6d7175]">
        {rangeStart}–{rangeEnd} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1 rounded-lg border border-[#c9cccf] text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-2 text-xs text-[#6d7175]">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 py-1 rounded-lg border border-[#c9cccf] text-[13px] font-medium text-[#202223] hover:border-[#8c9196] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
