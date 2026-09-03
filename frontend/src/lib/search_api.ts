/**
 * search_api.ts — typed wrappers around the shared API client
 * for the search endpoints.
 */

import api from "./api_client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceKind =
  | "document"
  | "folder"
  | "user";

export interface SearchResultItem {
  id: string;
  kind: ResourceKind;
  title: string;
  owner_id?: string | null;
  workspace_id?: string | null;
  file_type?: string | null;
  modified_at?: string | null;
}

export interface SearchResultData {
  query: string;
  total: number;
  limit: number;
  offset: number;
  items: SearchResultItem[];
}

export interface SearchParams {
  query: string;
  workspace_id?: string;
  file_type?: string;
  resource_kind?: ResourceKind;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(
  params: Record<string, string | number | undefined>
): string {
  const qs = Object.entries(params)
    .filter(
      ([, v]) =>
        v !== undefined &&
        v !== "" &&
        v !== null
    )
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");

  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /api/search
 * Global search across all resource types
 * (documents, folders, users).
 */
export async function globalSearch(
  params: SearchParams
): Promise<ApiResponse<SearchResultData>> {
  const qs = buildQueryString({
    query: params.query,
    workspace_id: params.workspace_id,
    file_type: params.file_type,
    resource_kind: params.resource_kind,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  const response = await api.get<ApiResponse<SearchResultData>>(
    `/api/search${qs}`
  );

  return response.data;
}

/**
 * GET /api/search/documents
 * Permission-aware document search only.
 */
export async function searchDocuments(
  params: Omit<SearchParams, "resource_kind">
): Promise<ApiResponse<SearchResultData>> {
  const qs = buildQueryString({
    query: params.query,
    workspace_id: params.workspace_id,
    file_type: params.file_type,
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  const response = await api.get<ApiResponse<SearchResultData>>(
    `/api/search/documents${qs}`
  );

  return response.data;
}

/**
 * GET /api/search/folders
 * Folder name search, optionally scoped to a workspace.
 */
export async function searchFolders(
  params: Pick<
    SearchParams,
    "query" | "workspace_id" | "limit" | "offset"
  >
): Promise<ApiResponse<SearchResultData>> {
  const qs = buildQueryString({
    query: params.query,
    workspace_id: params.workspace_id,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  const response = await api.get<ApiResponse<SearchResultData>>(
    `/api/search/folders${qs}`
  );

  return response.data;
}

/**
 * GET /api/search/users
 * Broad user search for the share-dialog people-picker.
 */
export async function searchUsers(
  params: Pick<
    SearchParams,
    "query" | "limit" | "offset"
  >
): Promise<ApiResponse<SearchResultData>> {
  const qs = buildQueryString({
    query: params.query,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  const response = await api.get<ApiResponse<SearchResultData>>(
    `/api/search/users${qs}`
  );

  return response.data;
}

