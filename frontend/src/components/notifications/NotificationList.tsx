"use client";

/**
 * NotificationList — the full notifications panel content.
 *
 * Renders: header with unread count + mark-all-read button, tab switcher
 * (All / Unread), list of NotificationItem rows, Pagination.
 *
 * TODO: wire to:
 *   GET  /api/notifications         (all tab)
 *   GET  /api/notifications/unread  (unread tab)
 *   PUT  /api/notifications/read_all
 */

import { useState } from "react";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import NotificationItem, { NotificationData } from "./NotificationItem";
import Badge from "@/components/ui/Badge";
import { BellOff } from "lucide-react";

interface NotificationListProps {
  notifications: NotificationData[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

type Tab = "all" | "unread";
const PAGE_SIZE = 8;

export default function NotificationList({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <Badge variant="info">{unreadCount} unread</Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs text-[var(--primary)]"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {(["all", "unread"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {pageItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted)]">
            <BellOff className="h-6 w-6" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            {activeTab === "unread"
              ? "You're all caught up!"
              : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {pageItems.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-[var(--border)] p-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
