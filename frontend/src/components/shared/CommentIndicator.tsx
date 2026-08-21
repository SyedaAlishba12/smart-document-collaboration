"use client";

import { MessageCircle } from "lucide-react";

interface CommentIndicatorProps {
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export default function CommentIndicator({
  count = 0,
  active = false,
  onClick,
}: CommentIndicatorProps) {
  if (count === 0 && !active) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${count} comments`}
      className="
        inline-flex items-center gap-1.5
        rounded-lg px-2 py-1
        text-[10px] font-medium
        text-[#77746c]
        transition
        hover:bg-[#f2f1ed]
        hover:text-[var(--foreground)]
      "
    >
      <MessageCircle
        className={`
          h-3.5 w-3.5
          ${active ? "fill-current" : ""}
        `}
      />

      <span>{count}</span>
    </button>
  );
}