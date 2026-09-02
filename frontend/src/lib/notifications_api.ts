/**
 * notifications_api.ts — typed wrappers around apiFetch for the notifications endpoints.
 */

import apiFetch from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "mention"
  | "share"
  | "comment"
  | "reply"
  | "permission_change"
  | "document_update";

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  resource_type: string;
  resource_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListData {
  total: number;
  limit: number;
  offset: number;
  items: NotificationItem[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /api/notifications?limit=&offset=
 * Returns all notifications for the current user (paginated).
 */
export async function getNotifications(
  limit = 20,
  offset = 0
): Promise<ApiResponse<NotificationListData>> {
  return apiFetch<ApiResponse<NotificationListData>>(
    `/api/notifications?limit=${limit}&offset=${offset}`
  );
}

/**
 * GET /api/notifications/unread?limit=&offset=
 * Returns only unread notifications for the current user.
 */
export async function getUnreadNotifications(
  limit = 20,
  offset = 0
): Promise<ApiResponse<NotificationListData>> {
  return apiFetch<ApiResponse<NotificationListData>>(
    `/api/notifications/unread?limit=${limit}&offset=${offset}`
  );
}

/**
 * PUT /api/notifications/{id}/read
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  id: string
): Promise<ApiResponse<NotificationItem>> {
  return apiFetch<ApiResponse<NotificationItem>>(
    `/api/notifications/${id}/read`,
    { method: "PUT" }
  );
}

/**
 * PUT /api/notifications/read_all
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<
  ApiResponse<{ updated_count: number }>
> {
  return apiFetch<ApiResponse<{ updated_count: number }>>(
    `/api/notifications/read_all`,
    { method: "PUT" }
  );
}

/**
 * DELETE /api/notifications/{id}
 * Delete a single notification.
 */
export async function deleteNotification(
  id: string
): Promise<ApiResponse<null>> {
  return apiFetch<ApiResponse<null>>(`/api/notifications/${id}`, {
    method: "DELETE",
  });
}
