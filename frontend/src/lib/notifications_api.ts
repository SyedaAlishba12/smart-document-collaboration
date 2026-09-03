/**
 * notifications_api.ts — typed wrappers around the shared API client
 * for the notifications endpoints.
 */

import api from "./api_client";

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
  const response = await api.get<ApiResponse<NotificationListData>>(
    `/api/notifications?limit=${limit}&offset=${offset}`
  );

  return response.data;
}

/**
 * GET /api/notifications/unread?limit=&offset=
 * Returns only unread notifications for the current user.
 */
export async function getUnreadNotifications(
  limit = 20,
  offset = 0
): Promise<ApiResponse<NotificationListData>> {
  const response = await api.get<ApiResponse<NotificationListData>>(
    `/api/notifications/unread?limit=${limit}&offset=${offset}`
  );

  return response.data;
}

/**
 * PUT /api/notifications/{id}/read
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  id: string
): Promise<ApiResponse<NotificationItem>> {
  const response = await api.put<ApiResponse<NotificationItem>>(
    `/api/notifications/${id}/read`
  );

  return response.data;
}

/**
 * PUT /api/notifications/read_all
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<
  ApiResponse<{ updated_count: number }>
> {
  const response = await api.put<ApiResponse<{ updated_count: number }>>(
    `/api/notifications/read_all`
  );

  return response.data;
}

/**
 * DELETE /api/notifications/{id}
 * Delete a single notification.
 */
export async function deleteNotification(
  id: string
): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(
    `/api/notifications/${id}`
  );

  return response.data;
}

