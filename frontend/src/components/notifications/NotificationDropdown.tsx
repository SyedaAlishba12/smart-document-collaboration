"use client";

/**
 * NotificationDropdown — compact bell icon with unread count badge.
 *
 * Shows the 5 most recent notifications in a dropdown panel.
 * Links to /notifications for the full view.
 *
 * Fetches from:
 *   GET /api/notifications/unread  (for badge count)
 *   GET /api/notifications?limit=5 (for the preview list)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getNotifications, getUnreadNotifications, markNotificationRead, NotificationItem } from "@/lib/notifications_api";
import { formatDistanceToNow } from "date-fns";

// Notification type → accent colour
const TYPE_COLOR: Record<string, string> = {
  mention: "bg-blue-100 text-blue-600",
  share: "bg-purple-100 text-purple-600",
  comment: "bg-amber-100 text-amber-600",
  reply: "bg-amber-100 text-amber-600",
  permission_change: "bg-green-100 text-green-600",
  document_update: "bg-gray-100 text-gray-500",
};

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch unread count on mount and every 60 seconds
  // ---------------------------------------------------------------------------
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotifications(1, 0);
      if (res.success && res.data) {
        setUnreadCount(res.data.total);
      }
    } catch {
      // Silently fail — badge count is non-critical
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // ---------------------------------------------------------------------------
  // Load preview list when dropdown opens
  // ---------------------------------------------------------------------------
  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(5, 0);
      if (res.success && res.data) {
        setNotifications(res.data.items);
      }
    } catch {
      // Keep empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadPreview();
  }, [open, loadPreview]);

  // ---------------------------------------------------------------------------
  // Close on outside click
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // ---------------------------------------------------------------------------
  // Mark a single notification as read from the dropdown
  // ---------------------------------------------------------------------------
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silent — UI already shows optimistic state
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        id="notification-bell"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold leading-none text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-[var(--border)]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="h-7 w-7 text-[var(--muted)]" />
                <p className="text-sm text-[var(--muted)]">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-[var(--surface-muted)] ${
                    !n.is_read ? "bg-[var(--primary-soft)]/20" : ""
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  {/* Coloured dot for type */}
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      !n.is_read ? "bg-[var(--primary)]" : "bg-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug ${
                        n.is_read
                          ? "text-[var(--foreground-secondary)]"
                          : "font-medium text-[var(--foreground)]"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer link */}
          <div className="border-t border-[var(--border)] p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full rounded-xl py-2 text-center text-xs font-medium text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
