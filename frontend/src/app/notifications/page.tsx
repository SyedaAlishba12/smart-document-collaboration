"use client";

/**
 * /notifications — full-page notifications view.
 *
 * Uses mock data. Wire to:
 *   GET  /api/notifications              (all tab)
 *   GET  /api/notifications/unread       (unread tab)
 *   PUT  /api/notifications/{id}/read
 *   PUT  /api/notifications/read_all
 *   DELETE /api/notifications/{id}
 *
 * TODO: replace MOCK_NOTIFICATIONS with fetch calls once the backend is live
 * (pending User model merge).
 */

import { useState } from "react";
import NotificationList from "@/components/notifications/NotificationList";
import Toast from "@/components/ui/Toast";
import { NotificationData } from "@/components/notifications/NotificationItem";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const INITIAL_NOTIFICATIONS: NotificationData[] = [
  {
    id: "1",
    type: "share",
    message: "Sayeel Ahmed shared \"Engineering Sprint Plan\" with you.",
    isRead: false,
    createdAt: "2 minutes ago",
    resourceType: "document",
    resourceId: "doc-1",
  },
  {
    id: "2",
    type: "mention",
    message: "Hamza Rauf mentioned you in a comment on \"Q3 Roadmap\".",
    isRead: false,
    createdAt: "1 hour ago",
    resourceType: "document",
    resourceId: "doc-2",
  },
  {
    id: "3",
    type: "comment",
    message: "New comment on \"Brand Guidelines v2\": \"Can we update the colour palette?\"",
    isRead: false,
    createdAt: "3 hours ago",
    resourceType: "document",
    resourceId: "doc-3",
  },
  {
    id: "4",
    type: "permission_change",
    message: "Your access to \"Product Roadmap\" was changed from Viewer to Editor.",
    isRead: true,
    createdAt: "Yesterday",
    resourceType: "document",
    resourceId: "doc-4",
  },
  {
    id: "5",
    type: "reply",
    message: "Fatima replied to your comment on \"Design System v3\".",
    isRead: true,
    createdAt: "2 days ago",
    resourceType: "document",
    resourceId: "doc-5",
  },
  {
    id: "6",
    type: "document_update",
    message: "\"Engineering Sprint Plan\" was updated by Sayeel Ahmed.",
    isRead: true,
    createdAt: "3 days ago",
    resourceType: "document",
    resourceId: "doc-1",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>(
    INITIAL_NOTIFICATIONS
  );
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "info";
  }>({ show: false, message: "", variant: "success" });

  // TODO: PUT /api/notifications/{id}/read
  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // TODO: PUT /api/notifications/read_all
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setToast({ show: true, message: "All notifications marked as read.", variant: "success" });
  };

  // TODO: DELETE /api/notifications/{id}
  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setToast({ show: true, message: "Notification deleted.", variant: "info" });
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Notifications
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Stay up to date with your documents and workspace.{" "}
            <span className="italic opacity-60">
              (Mock data — API pending model merge)
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <NotificationList
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </main>
  );
}
