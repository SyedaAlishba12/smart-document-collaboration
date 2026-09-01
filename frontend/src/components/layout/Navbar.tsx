"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, initials, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full bg-[#dedbd2]
              text-[10px] font-semibold text-[#57534e]
              ring-2 ring-transparent
              transition hover:ring-[var(--border-strong)]
            "
            aria-label="User menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              className="
                absolute right-0 top-11 z-50 w-56
                overflow-hidden rounded-xl
                border border-[var(--border)]
                bg-[var(--surface)]
                shadow-[var(--shadow-md)]
              "
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                  {user?.full_name ?? "Loading..."}
                </p>
                <p className="truncate text-[10px] text-[var(--muted)]">{user?.email}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              >
                <User className="h-3.5 w-3.5 text-[var(--muted)]" />
                Profile
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
