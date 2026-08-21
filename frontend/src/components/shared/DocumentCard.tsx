"use client";

import {
  FileText,
  MoreHorizontal,
  Star,
  Users,
} from "lucide-react";

export interface DocumentCardProps {
  name: string;
  type?: string;
  updatedAt?: string;
  owner?: string;
  status?: "Private" | "Shared";
  favorite?: boolean;
  onClick?: () => void;
  onFavorite?: () => void;
  onAction?: () => void;
}

export default function DocumentCard({
  name,
  type = "DOC",
  updatedAt = "Recently",
  owner = "You",
  status = "Private",
  favorite = false,
  onClick,
  onFavorite,
  onAction,
}: DocumentCardProps) {
  return (
    <div
      className="
        group relative flex min-w-0 items-center gap-4
        rounded-xl border border-[var(--border)]
        bg-white px-4 py-3.5
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:border-[var(--border-strong)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]
      "
    >
      {/* Document icon */}
      <button
        type="button"
        onClick={onClick}
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-xl bg-[#eeece6]
          text-[#77746c]
          transition-colors
          hover:bg-[#e5e2da]
        "
        aria-label={`Open ${name}`}
      >
        <FileText className="h-[17px] w-[17px]" />
      </button>

      {/* Document information */}
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {name}
          </p>

          {status === "Shared" && (
            <span
              className="
                inline-flex shrink-0 items-center gap-1
                rounded-full bg-[#f1f0ec]
                px-2 py-0.5
                text-[9px] font-medium text-[#77746c]
              "
            >
              <Users className="h-2.5 w-2.5" />
              Shared
            </span>
          )}
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-[var(--muted)]">
          <span className="shrink-0 uppercase tracking-wide">
            {type}
          </span>

          <span className="text-[#c5c2ba]">•</span>

          <span className="truncate">
            {owner}
          </span>

          <span className="text-[#c5c2ba]">•</span>

          <span className="truncate">
            {updatedAt}
          </span>
        </div>
      </button>

      {/* Favorite */}
      <button
        type="button"
        onClick={onFavorite}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-lg
          text-[#aaa79f]
          transition
          hover:bg-[#f5f4f0]
          hover:text-[var(--primary)]
        "
      >
        <Star
          className="h-4 w-4"
          fill={favorite ? "currentColor" : "none"}
        />
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