"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-sm text-[var(--muted)]">
        Page{" "}
        <span className="font-medium text-[var(--foreground)]">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--foreground)]">
          {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-600 transition hover:bg-[var(--surface-muted)] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
              page === currentPage
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] bg-white text-slate-600 hover:bg-[var(--surface-muted)]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-slate-600 transition hover:bg-[var(--surface-muted)] disabled:pointer-events-none disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}