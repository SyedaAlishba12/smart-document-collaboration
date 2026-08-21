"use client";

import { Search, X } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

export default function SearchInput({
  value,
  onClear,
  placeholder = "Search documents, folders, people...",
  className = "",
  ...props
}: SearchInputProps) {
  const hasValue = Boolean(value);

  return (
    <div className={`relative w-full ${className}`}>
      <Search
        className="
          pointer-events-none absolute left-3.5 top-1/2
          h-4 w-4 -translate-y-1/2
          text-[#929087]
        "
      />

      <input
        {...props}
        type="search"
        value={value}
        placeholder={placeholder}
        className="
          h-10 w-full rounded-xl
          border border-[var(--border)]
          bg-white
          pl-10 pr-10
          text-sm text-[var(--foreground)]
          outline-none
          placeholder:text-[#aaa79f]
          transition
          focus:border-[var(--primary)]
          focus:ring-2
          focus:ring-[var(--primary)]/10
        "
      />

      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="
            absolute right-2.5 top-1/2
            flex h-6 w-6 -translate-y-1/2
            items-center justify-center
            rounded-md
            text-[#929087]
            transition
            hover:bg-[#f2f1ed]
            hover:text-[var(--foreground)]
          "
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}