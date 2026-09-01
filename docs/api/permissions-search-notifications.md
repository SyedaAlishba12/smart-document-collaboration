# API Reference â€” Permissions, Search & Notifications

**Module owner:** Taha Tanvir  
**Branch:** `feature/permissions-search-notifications`  
**Last updated:** 2026-08-26  
**Base URL:** `http://localhost:8000` (development)

> **Auto-generated docs** are also available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` when the server is running. This document is the human-readable standalone reference required by the project deliverables spec.

---

## Module Dependencies

This module scaffolds routes, schemas, and controllers for **Sharing/Permissions, Global Search,** and **Notifications**. Several endpoints currently return `HTTP 200 success: false` (stub behaviour) because the service-layer logic requires database tables that are still being built by other team members:

| Dependency | Owner | Branch |
|---|---|---|
| `User` model & table | Fatima | `feature/auth` |
| `Document` model & table | â€” | shared skeleton |
| `Folder` model & table | â€” | shared skeleton |
| `Workspace` model & table | â€” | shared skeleton |

**Where this is noted in code:**
- Service stubs: [`backend/services/permission_service.py`](../../backend/services/permission_service.py) and [`backend/services/notification_service.py`](../../backend/services/notification_service.py) â€” all function bodies `raise NotImplementedError`.
- Controller stub-catch: [`backend/controllers/permission_controller.py`](../../backend/controllers/permission_controller.py) and [`backend/controllers/notification_controller.py`](../../backend/controllers/notification_controller.py) â€” catch `NotImplementedError` and return the stub envelope.
- Schema TODOs: [`backend/schemas/search_schema.py`](../../backend/schemas/search_schema.py) â€” `SearchResultItem` fields `owner_id`, `workspace_id`, `modified_at` are marked `# TODO` pending model merge.

---

## Authentication

All 15 endpoints require an authenticated user resolved by `get_current_user_id` in [`backend/middleware/permission_middleware.py`](../../backend/middleware/permission_middleware.py).

> **âš  Current status â€” stub auth:**  
> `get_current_user_id` returns a fixed sentinel UUID (`00000000-0000-0000-0000-000000000001`) for all requests. No token is validated. Will be replaced with real JWT parsing once Fatima's auth module is merged.

**Expected future header (once auth lands):**
```
Authorization: Bearer <jwt_token>
```

**Permission guard behaviour while stubs are active:**  
Endpoints guarded by `require_can_share` or `require_can_view` currently raise `HTTP 501` because the underlying `permission_service.can_share()` / `can_view()` stubs also raise `NotImplementedError`. This is intentional â€” the routes are wired and schema-validated, but not yet executable end-to-end.

---

## Standard Response Envelope

Every endpoint returns JSON in this shape:

```json
{
  "success": true | false,
  "message": "Human-readable result description",
  "data": { ... } | null
}
```

`data` contains the schema-specific payload described per endpoint below.  
`success: false` does **not** always mean an HTTP error â€” stub responses return `HTTP 200` with `success: false` and a message explaining the dependency gap.

---

## Section 1 â€” Permissions & Sharing

Routes: [`backend/routes/permission_routes.py`](../../backend/routes/permission_routes.py)  
Controllers: [`backend/controllers/permission_controller.py`](../../backend/controllers/permission_controller.py)  
Schemas: [`backend/schemas/permission_schema.py`](../../backend/schemas/permission_schema.py)

### Shared enum literals

| Alias | Accepted values |
|---|---|
| `PermissionLevelLiteral` | `"owner"` \| `"editor"` \| `"commenter"` \| `"viewer"` |
| `SharingScopeLiteral` | `"private"` \| `"workspace"` \| `"anyone_with_link"` |
| `ResourceTypeLiteral` | `"document"` \| `"folder"` |

---

### POST `/api/documents/{document_id}/share`

Grant a user access to a document.

**Auth guard:** `require_can_share("document")`

**Path params:**

| Param | Type | |
|---|---|---|
| `document_id` | UUID | Document to share |

**Request body** â€” `ShareDocumentRequest`:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user_id` | UUID | âœ… | â€” | Recipient user UUID |
| `permission_level` | `PermissionLevelLiteral` | âœ… | â€” | `"owner"` \| `"editor"` \| `"commenter"` \| `"viewer"` |
| `sharing_scope` | `SharingScopeLiteral` | âŒ | `"private"` | |
| `message` | `string` \| `null` | âŒ | `null` | Max 500 chars; included in invite notification |

> `granted_by` is derived from the session â€” **not** a body field.

**Success response** â€” `data: PermissionResponse`:

```json
{
  "success": true,
  "message": "Permission granted successfully.",
  "data": {
    "id": "uuid",
    "resource_type": "document",
    "resource_id": "uuid",
    "user_id": "uuid",
    "permission_level": "editor",
    "sharing_scope": "private",
    "granted_by": "uuid",
    "created_at": "2026-08-26T00:00:00Z",
    "updated_at": "2026-08-26T00:00:00Z"
  }
}
```

**Current status:** ðŸ”´ **Stub**  
`grant_permission()` raises `NotImplementedError`. Response:
```json
{ "success": false, "message": "grant_permission is not yet implemented â€” pending User/Document model merge.", "data": null }
```

---

### GET `/api/documents/{document_id}/permissions`

List all permission grants on a document.

**Auth guard:** `require_can_view("document")`

**Path params:**

| Param | Type | |
|---|---|---|
| `document_id` | UUID | Document whose grants to list |

**Query params:** None.

**Success response** â€” `data: list[PermissionResponse]`:

```json
{
  "success": true,
  "message": "Permissions retrieved.",
  "data": [
    {
      "id": "uuid",
      "resource_type": "document",
      "resource_id": "uuid",
      "user_id": "uuid",
      "permission_level": "editor",
      "sharing_scope": "private",
      "granted_by": "uuid",
      "created_at": "2026-08-26T00:00:00Z",
      "updated_at": "2026-08-26T00:00:00Z"
    }
  ]
}
```

**Current status:** ðŸ”´ **Stub**  
`list_permissions()` service function not yet scaffolded (noted as TODO in controller). Response:
```json
{ "success": false, "message": "list_permissions is not yet implemented â€” pending User/Document model merge.", "data": null }
```

---

### PUT `/api/documents/{document_id}/permissions/{permission_id}`

Update the permission level or sharing scope of an existing grant.

**Auth guard:** `require_can_share("document")`

**Path params:**

| Param | Type | |
|---|---|---|
| `document_id` | UUID | Owning document |
| `permission_id` | UUID | Specific grant to update |

**Request body** â€” `UpdatePermissionRequest`:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `permission_level` | `PermissionLevelLiteral` \| `null` | âŒ | `null` | New level, if changing |
| `sharing_scope` | `SharingScopeLiteral` \| `null` | âŒ | `null` | New scope, if changing |

> At least one field must be provided. Controller-level validation (not yet a Pydantic validator â€” flagged).

**Current status:** ðŸ”´ **Stub**  
`update_permission()` not yet in service. Response:
```json
{ "success": false, "message": "update_permission is not yet implemented â€” pending User/Document model merge.", "data": null }
```

---

### DELETE `/api/documents/{document_id}/permissions/{permission_id}`

Revoke a specific permission grant, removing that user's access.

**Auth guard:** `require_can_share("document")`

**Path params:**

| Param | Type | |
|---|---|---|
| `document_id` | UUID | Owning document |
| `permission_id` | UUID | Grant to delete |

**Request body:** None.

**Success response:**
```json
{ "success": true, "message": "Permission revoked.", "data": null }
```

**Error responses:**

| HTTP | Condition |
|---|---|
| `404` | Permission not found (`LookupError` â€” wired in controller, active once implemented) |
| `200 success: false` | Stub active |

**Current status:** ðŸ”´ **Stub**  
`revoke_permission()` raises `NotImplementedError`. The `404` path is wired and will fire once the service is live.

---

### POST `/api/documents/{document_id}/link_sharing`

Enable or disable link-based sharing and set the permission level for link-holders.

**Auth guard:** `require_can_share("document")`

**Path params:**

| Param | Type | |
|---|---|---|
| `document_id` | UUID | Document to configure |

**Request body** â€” `LinkSharingRequest`:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `enabled` | `bool` | âœ… | â€” | `true` activates, `false` deactivates link sharing |
| `link_permission_level` | `PermissionLevelLiteral` \| `null` | âŒ | `"viewer"` | Ignored when `enabled: false` |

**Success response** â€” `data: LinkSharingResponse`:

| Field | Type | Notes |
|---|---|---|
| `enabled` | `bool` | |
| `link_permission_level` | `PermissionLevelLiteral` \| `null` | |
| `shareable_link` | `string` \| `null` | `null` when `enabled: false` |

> **Open design question** (noted in controller): shareable link generation strategy â€” signed URL vs. opaque token â€” needs team alignment before implementation.

**Current status:** ðŸ”´ **Stub**  
Response:
```json
{ "success": false, "message": "configure_link_sharing is not yet implemented â€” pending User/Document model merge.", "data": null }
```

---

## Section 2 â€” Global Search

Routes: [`backend/routes/search_routes.py`](../../backend/routes/search_routes.py)  
Controller: [`backend/controllers/search_controller.py`](../../backend/controllers/search_controller.py)  
Schemas: [`backend/schemas/search_schema.py`](../../backend/schemas/search_schema.py)

### Shared enum literal

| Alias | Values |
|---|---|
| `ResourceKind` | `"document"` \| `"folder"` \| `"user"` |

### Common query parameters (all four search endpoints)

| Param | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `query` | `string` | âœ… | â€” | min 1, max 500 | Full-text search string |
| `workspace_id` | UUID \| `null` | âŒ | `null` | â€” | Restrict to workspace |
| `file_type` | `string` \| `null` | âŒ | `null` | max 50 chars | e.g. `"pdf"`, `"docx"` |
| `resource_kind` | `ResourceKind` \| `null` | âŒ | `null` | â€” | `/api/search` only; scoped endpoints fix this |
| `date_from` | ISO 8601 datetime \| `null` | âŒ | `null` | â€” | Modified on or after |
| `date_to` | ISO 8601 datetime \| `null` | âŒ | `null` | â€” | Modified on or before |
| `limit` | `int` | âŒ | `20` | 1â€“100 | Page size |
| `offset` | `int` | âŒ | `0` | â‰¥ 0 | Row offset |

### `SearchResultItem` shape

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Resource UUID |
| `kind` | `ResourceKind` | `"document"` \| `"folder"` \| `"user"` |
| `title` | `string` | Document title / folder name / user display name |
| `owner_id` | UUID \| `null` | **TODO** â€” depends on `User.id` (not on this branch yet) |
| `workspace_id` | UUID \| `null` | **TODO** â€” depends on `Workspace.id` (not on this branch yet) |
| `file_type` | `string` \| `null` | Document-only; `null` for folders and users |
| `modified_at` | ISO 8601 \| `null` | **TODO** â€” depends on `Document.updated_at` (not on this branch yet) |
| `extra` | `object` \| `null` | Catch-all; will be specialised into discriminated union post-merge |

### `SearchResultResponse` shape

```json
{
  "query": "roadmap",
  "total": 0,
  "limit": 20,
  "offset": 0,
  "items": []
}
```

> All four endpoints currently return `items: []`, `total: 0`, `success: false`. `data` is always an object (never `null`) so frontends can safely read `data.items`.

---

### GET `/api/search`

Search across all resource types.

**Auth guard:** `get_current_user_id`  
**Query params:** Full set including `resource_kind`.  
**Current status:** ðŸ”´ **Stub** â€” blocked on Document, Folder, User tables.

---

### GET `/api/search/documents`

Search documents only.

**Auth guard:** `get_current_user_id`  
**Query params:** Full set minus `resource_kind` (fixed to `"document"`).  
**Current status:** ðŸ”´ **Stub**

---

### GET `/api/search/folders`

Search folders only.

**Auth guard:** `get_current_user_id`  
**Query params:** `query`, `workspace_id`, `limit`, `offset` (`file_type`, date range not applicable to folders).  
**Current status:** ðŸ”´ **Stub**

---

### GET `/api/search/users`

Search users by name or email. Primary use case is the share-dialog people-picker.

**Auth guard:** `get_current_user_id`  
**Query params:** `query`, `workspace_id`, `limit`, `offset`.  
**Current status:** ðŸ”´ **Stub** â€” blocked on User table.

---

## Section 3 â€” Notifications

Routes: [`backend/routes/notification_routes.py`](../../backend/routes/notification_routes.py)  
Controller: [`backend/controllers/notification_controller.py`](../../backend/controllers/notification_controller.py)  
Schemas: [`backend/schemas/notification_schema.py`](../../backend/schemas/notification_schema.py)

> **Route ordering note:** `PUT /api/notifications/read_all` is declared **before** `PUT /api/notifications/{notification_id}/read` in the router to prevent FastAPI from parsing the literal string `"read_all"` as a UUID.

### Shared enum literal

| Alias | Values |
|---|---|
| `NotificationTypeLiteral` | `"mention"` \| `"share"` \| `"comment"` \| `"reply"` \| `"permission_change"` \| `"document_update"` |

### `NotificationResponse` shape

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Notification row UUID |
| `user_id` | UUID | Recipient UUID |
| `type` | `NotificationTypeLiteral` | Event kind |
| `resource_type` | `string` | Free string â€” `"document"`, `"comment"`, etc. Not an enum, so new types don't need a migration |
| `resource_id` | UUID | UUID of the resource the event is about |
| `message` | `string` | Human-readable notification body |
| `is_read` | `bool` | `false` until marked read |
| `created_at` | ISO 8601 datetime | UTC. No `updated_at` â€” notifications are immutable |

---

### GET `/api/notifications`

Return paginated notifications for the current user, newest first.

**Auth guard:** `get_current_user_id`

**Query params:**

| Param | Type | Default | Constraints |
|---|---|---|---|
| `limit` | `int` | `20` | 1â€“100 |
| `offset` | `int` | `0` | â‰¥ 0 |

**Success response** â€” `data: NotificationListResponse`:

```json
{
  "success": true,
  "message": "Notifications retrieved.",
  "data": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "items": [ { "...NotificationResponse fields..." } ]
  }
}
```

**Current status:** ðŸ”´ **Stub**  
`get_user_notifications()` raises `NotImplementedError`. Response:
```json
{ "success": false, "message": "get_user_notifications is not yet implemented â€” pending User model merge.", "data": null }
```

---

### GET `/api/notifications/unread`

Return only unread notifications (`is_read: false`) for the current user.

**Auth guard:** `get_current_user_id`  
**Query params:** `limit` (default `20`, max `100`), `offset` (default `0`).  
**Success response:** same shape as `GET /api/notifications` â€” `NotificationListResponse` â€” all items have `is_read: false`.  
**Current status:** ðŸ”´ **Stub** â€” same `get_user_notifications()` stub, called with `unread_only=True`.

---

### PUT `/api/notifications/read_all`

Bulk-mark all unread notifications for the current user as read via a single `UPDATE` statement.

**Auth guard:** `get_current_user_id`  
**Request body:** None.

**Success response:**
```json
{
  "success": true,
  "message": "5 notification(s) marked as read.",
  "data": { "updated_count": 5 }
}
```

**Current status:** ðŸ”´ **Stub**  
`mark_all_as_read()` raises `NotImplementedError`. Response:
```json
{ "success": false, "message": "mark_all_as_read is not yet implemented â€” pending User model merge.", "data": null }
```

---

### PUT `/api/notifications/{notification_id}/read`

Mark a single notification as read. Ownership-guarded â€” rejects attempts to mark another user's notification.

**Auth guard:** `get_current_user_id`

**Path params:**

| Param | Type | |
|---|---|---|
| `notification_id` | UUID | Notification to mark read |

**Request body:** None.

**Success response** â€” `data: NotificationResponse` (with `is_read: true`):
```json
{ "success": true, "message": "Notification marked as read.", "data": { "...NotificationResponse..." } }
```

**Error responses:**

| HTTP | Condition |
|---|---|
| `404` | Notification not found for this user (`LookupError` â€” wired, fires once implemented) |
| `200 success: false` | Stub active |

**Current status:** ðŸ”´ **Stub**

---

### DELETE `/api/notifications/{notification_id}`

Hard-delete a notification. Ownership-guarded. No soft-delete.

**Auth guard:** `get_current_user_id`

**Path params:**

| Param | Type | |
|---|---|---|
| `notification_id` | UUID | Notification to delete |

**Request body:** None.

**Success response:**
```json
{ "success": true, "message": "Notification deleted.", "data": null }
```

**Error responses:**

| HTTP | Condition |
|---|---|
| `404` | Notification not found for this user (`LookupError` â€” wired, fires once implemented) |
| `200 success: false` | Stub active |

**Current status:** ðŸ”´ **Stub**

---

## Endpoint Status Summary

| # | Method | Path | Guard | Status |
|---|---|---|---|---|
| 1 | `POST` | `/api/documents/{id}/share` | `require_can_share` | ðŸ”´ Stub |
| 2 | `GET` | `/api/documents/{id}/permissions` | `require_can_view` | ðŸ”´ Stub |
| 3 | `PUT` | `/api/documents/{id}/permissions/{perm_id}` | `require_can_share` | ðŸ”´ Stub |
| 4 | `DELETE` | `/api/documents/{id}/permissions/{perm_id}` | `require_can_share` | ðŸ”´ Stub (404 wired) |
| 5 | `POST` | `/api/documents/{id}/link_sharing` | `require_can_share` | ðŸ”´ Stub |
| 6 | `GET` | `/api/search` | auth only | ðŸ”´ Stub |
| 7 | `GET` | `/api/search/documents` | auth only | ðŸ”´ Stub |
| 8 | `GET` | `/api/search/folders` | auth only | ðŸ”´ Stub |
| 9 | `GET` | `/api/search/users` | auth only | ðŸ”´ Stub |
| 10 | `GET` | `/api/notifications` | auth only | ðŸ”´ Stub |
| 11 | `GET` | `/api/notifications/unread` | auth only | ðŸ”´ Stub |
| 12 | `PUT` | `/api/notifications/read_all` | auth only | ðŸ”´ Stub |
| 13 | `PUT` | `/api/notifications/{id}/read` | auth only | ðŸ”´ Stub (404 wired) |
| 14 | `DELETE` | `/api/notifications/{id}` | auth only | ðŸ”´ Stub (404 wired) |

> All 15 paths are registered and return HTTP 200. "404 wired" means the `LookupError â†’ 404` handler is already in the controller and will activate automatically once the service returns a real `LookupError`.

---

## What Unblocks Each Section

| Section | Blocked on | Next action |
|---|---|---|
| All permission endpoints | `User`, `Document`, `Folder` tables + FK migration | Merge shared skeleton â†’ run migration â†’ implement `permission_service.py` functions |
| All search endpoints | `Document`, `Folder`, `User` tables + full-text index | Same + create `services/search_service.py` |
| Notification CRUD | `User` table | User table alone unblocks notifications; document/comment FKs can come after |
| Auth guards | Fatima's auth module | Replace `get_current_user_id` stub in `middleware/permission_middleware.py` |
| Shareable link generation | Team design decision | Align on signed URL vs. opaque token strategy before implementing `configure_link_sharing` |
