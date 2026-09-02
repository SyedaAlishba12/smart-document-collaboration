"use client";

/**
 * /notifications — full-page notifications view.
 *
 * Fetches from the real API:
 *   GET  /api/notifications        (all tab)
 *   GET  /api/notifications/unread (unread tab)
 *   PUT  /api/notifications/{id}/read
 *   PUT  /api/notifications/read_all
 *   DELETE /api/notifications/{id}
 */

import { useState, useEffect, useCallback } from "react";
import NotificationList from "@/components/notifications/NotificationList";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";
import { NotificationData } from "@/components/notifications/NotificationItem";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NotificationItem,
} from "@/lib/notifications_api";
import { formatDistanceToNow } from "date-fns";

// Convert the API shape to the shape NotificationItem component expects
function toUiNotification(n: NotificationItem): NotificationData {
  let createdAt = n.created_at;
  try {
    createdAt = formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
  } catch {
    // fallback to raw string if parsing fails
  }
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    isRead: n.is_read,
    createdAt,
    resourceType: n.resource_type,
    resourceId: n.resource_id,
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "info";
  }>({ show: false, message: "", variant: "success" });

  // ---------------------------------------------------------------------------
  // Fetch all notifications on mount
  // ---------------------------------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(50, 0);
      if (res.success && res.data) {
        setNotifications(res.data.items.map(toUiNotification));
      }
    } catch {
      // Keep existing list on network error; page still usable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ---------------------------------------------------------------------------
  // Mark single notification as read (optimistic update)
  // ---------------------------------------------------------------------------
  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch {
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Mark all as read (optimistic update)
  // ---------------------------------------------------------------------------
  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const res = await markAllNotificationsRead();
      if (res.success) {
        setToast({
          show: true,
          message: "All notifications marked as read.",
          variant: "success",
        });
      }
    } catch {
      setNotifications(previous); // revert
    }
  };

  // ---------------------------------------------------------------------------
  // Delete notification (optimistic update)
  // ---------------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
      setToast({ show: true, message: "Notification deleted.", variant: "info" });
    } catch {
      setNotifications(previous); // revert
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--muted)] transition hover:bg-gray-50 hover:text-[var(--foreground)]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Notifications
            </h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              Stay up to date with your documents and workspace.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onDelete={handleDelete}
            />
          )}
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
