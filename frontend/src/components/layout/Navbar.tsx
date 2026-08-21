"use client";

import {
  Bell,
  Command,
  Menu,
  Plus,
  Search,
} from "lucide-react";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header
      className="
        sticky top-0 z-40
        flex h-[72px] shrink-0 items-center
        border-b border-[var(--border)]
        bg-[var(--background)]/90
        px-5 backdrop-blur-xl
        md:px-7
      "
    >
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="
          mr-3 flex h-9 w-9 items-center justify-center
          rounded-lg border border-[var(--border)]
          bg-white text-[var(--muted)]
          lg:hidden
        "
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <button
        type="button"
        className="
          group flex h-10 w-full max-w-[380px]
          items-center gap-3
          rounded-xl border border-[var(--border)]
          bg-white/70 px-3.5
          text-left transition
          hover:border-[var(--border-strong)]
          hover:bg-white
        "
      >
        <Search className="h-4 w-4 text-[#99968e]" />

        <span className="flex-1 text-xs text-[#99968e]">
          Search documents, people, or workspaces
        </span>

        <span className="hidden items-center gap-1 rounded-md border border-[var(--border)] bg-[#f5f4f0] px-1.5 py-1 text-[9px] font-medium text-[#99968e] sm:flex">
          <Command className="h-2.5 w-2.5" />
          K
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Create */}
        <button
          type="button"
          className="
            hidden h-9 items-center gap-2
            rounded-lg bg-[var(--primary)]
            px-3.5 text-xs font-semibold text-white
            shadow-sm transition
            hover:bg-[var(--primary-hover)]
            sm:flex
          "
        >
          <Plus className="h-3.5 w-3.5" />
          New document
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="
            relative flex h-9 w-9
            items-center justify-center
            rounded-lg border border-[var(--border)]
            bg-white/70 text-[#77746c]
            transition hover:bg-white
          "
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
        </button>

        {/* Avatar */}
        <button
          type="button"
          className="
            flex h-9 w-9 items-center justify-center
            rounded-full bg-[#dedbd2]
            text-[10px] font-semibold text-[#57534e]
            ring-2 ring-transparent
            transition hover:ring-[var(--border-strong)]
          "
          aria-label="User menu"
        >
          SA
        </button>
      </div>
    </header>
  );
}