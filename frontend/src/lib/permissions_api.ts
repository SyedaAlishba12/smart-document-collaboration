/**
 * permissions_api.ts — typed wrappers around the shared API client
 * for the permissions endpoints.
 *
 * All functions return the full API envelope:
 * { success, message, data }
 *
 * Callers should read `.data` for the payload and check `.success`
 * for errors.
 */

import api from "./api_client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PermissionLevel =
  | "owner"
  | "editor"
  | "commenter"
  | "viewer";

export type SharingScope =
  | "private"
  | "workspace"
  | "anyone_with_link";

export interface PermissionEntry {
  id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar_url?: string | null;
  permission_level: PermissionLevel;
  sharing_scope: SharingScope;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionListData {
  total: number;
  items: PermissionEntry[];
}

export interface PermissionData {
  id: string;
  document_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  sharing_scope: SharingScope;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface LinkSharingData {
  enabled: boolean;
  link_permission_level: PermissionLevel | null;
  shareable_link: string | null;
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
 * GET /api/documents/{documentId}/permissions
 * Returns all users who have access to a document,
 * including their name/email.
 */
export async function getPermissions(
  documentId: string
): Promise<ApiResponse<PermissionListData>> {
  const response = await api.get<ApiResponse<PermissionListData>>(
    `/api/documents/${documentId}/permissions`
  );

  return response.data;
}

/**
 * POST /api/documents/{documentId}/share
 * Grant a user access to a document.
 */
export async function shareDocument(
  documentId: string,
  body: {
    user_id: string;
    permission_level: PermissionLevel;
    sharing_scope?: SharingScope;
    message?: string;
  }
): Promise<ApiResponse<PermissionData>> {
  const response = await api.post<ApiResponse<PermissionData>>(
    `/api/documents/${documentId}/share`,
    body
  );

  return response.data;
}

/**
 * PUT /api/documents/{documentId}/permissions/{permissionId}
 * Update an existing permission grant's level or scope.
 */
export async function updatePermission(
  documentId: string,
  permissionId: string,
  body: {
    permission_level?: PermissionLevel;
    sharing_scope?: SharingScope;
  }
): Promise<ApiResponse<PermissionData>> {
  const response = await api.put<ApiResponse<PermissionData>>(
    `/api/documents/${documentId}/permissions/${permissionId}`,
    body
  );

  return response.data;
}

/**
 * DELETE /api/documents/{documentId}/permissions/{permissionId}
 * Revoke a user's access to a document.
 */
export async function revokePermission(
  documentId: string,
  permissionId: string
): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(
    `/api/documents/${documentId}/permissions/${permissionId}`
  );

  return response.data;
}

/**
 * POST /api/documents/{documentId}/link_sharing
 * Enable or disable link-based sharing for a document.
 */
export async function configureLinkSharing(
  documentId: string,
  body: {
    enabled: boolean;
    link_permission_level?: PermissionLevel;
  }
): Promise<ApiResponse<LinkSharingData>> {
  const response = await api.post<ApiResponse<LinkSharingData>>(
    `/api/documents/${documentId}/link_sharing`,
    body
  );

  return response.data;
}

