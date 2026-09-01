"use client";

/**
 * NotificationItem — a single row in the notification list.
 *
 * Renders: icon for notification type, message, timestamp, unread dot,
 * and a dropdown with mark-as-read / delete actions.
 *
 * TODO: wire onMarkRead / onDelete to:
 *   PUT  /api/notifications/{id}/read
 *   DELETE /api/notifications/{id}
 */

import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import { MoreHorizontal, Bell, Share2, MessageSquare, Reply, ShieldCheck, FileEdit } from "lucide-react";

export type NotificationType =
  | "mention"
  | "share"
  | "comment"
  | "reply"
  | "permission_change"
  | "document_update";

export interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;   // display string, e.g. "2 hours ago"
  resourceType: string;
  resourceId: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  mention: Bell,
  share: Share2,
  comment: MessageSquare,
  reply: Reply,
  permission_change: ShieldCheck,
  document_update: FileEdit,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  mention: "bg-[var(--info-soft)] text-[var(--info)]",
  share: "bg-[var(--primary-soft)] text-[var(--primary)]",
  comment: "bg-[var(--warning-soft)] text-[var(--warning)]",
  reply: "bg-[var(--warning-soft)] text-[var(--warning)]",
  permission_change: "bg-[var(--success-soft)] text-[var(--success)]",
  document_update: "bg-[var(--surface-muted)] text-[var(--muted)]",
};

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const Icon = TYPE_ICON[notification.type];

  const menuItems: DropdownItem[] = [
    ...(!notification.isRead
      ? [
          {
            label: "Mark as read",
            onClick: () => onMarkRead(notification.id),
          },
        ]
      : []),
    {
      label: "Delete",
      onClick: () => onDelete(notification.id),
      danger: true,
    },
  ];

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3.5 transition hover:bg-[var(--surface-muted)] ${
        !notification.isRead ? "bg-[var(--primary-soft)]/30" : ""
      }`}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          TYPE_COLOR[notification.type]
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.isRead
              ? "text-[var(--foreground-secondary)]"
              : "font-medium text-[var(--foreground)]"
          }`}
        >
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {notification.createdAt}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
      )}

      {/* Actions menu */}
      <div className="shrink-0 opacity-0 transition group-hover:opacity-100">
        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              aria-label="Notification actions"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={menuItems}
        />
      </div>
    </div>
  );
}
