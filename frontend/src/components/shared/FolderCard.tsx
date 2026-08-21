"use client";

import {
  Folder,
  MoreHorizontal,
} from "lucide-react";

export interface FolderCardProps {
  name: string;
  itemCount?: number;
  updatedAt?: string;
  onClick?: () => void;
  onAction?: () => void;
}

export default function FolderCard({
  name,
  itemCount = 0,
  updatedAt = "Recently",
  onClick,
  onAction,
}: FolderCardProps) {
  return (
    <div
      className="
        group flex min-w-0 items-center gap-4
        rounded-xl border border-[var(--border)]
        bg-white px-4 py-4
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:border-[var(--border-strong)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]
      "
    >
      {/* Folder */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${name}`}
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl bg-[#f0eee8]
          text-[#77746c]
          transition
          hover:bg-[#e8e5dd]
        "
      >
        <Folder className="h-[18px] w-[18px]" />
      </button>

      {/* Information */}
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {name}
        </p>

        <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--muted)]">
          <span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>

          <span className="text-[#c5c2ba]">•</span>

          <span className="truncate">
            Updated {updatedAt}
          </span>
        </div>
      </button>

      {/* Actions */}
      <button
        type="button"
        onClick={onAction}
        aria-label={`Actions for ${name}`}
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-lg
          text-[#aaa79f]
          opacity-70
          transition
          hover:bg-[#f5f4f0]
          hover:text-[var(--foreground)]
          group-hover:opacity-100
        "
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}