"""
tests/test_route_registration.py — Route registration tests.

What is tested
--------------
Confirm that all 15 API paths owned by this module are registered in
main.app and respond to requests.  No real DB or auth is needed:

  - DB dependency is overridden with a no-op (see conftest.py).
  - Auth dependency is overridden with the sentinel UUID.
  - Permission-guard middleware calls service stubs which raise
    NotImplementedError → 501.  501 means the route *was* reached and
    the request was processed (schema-validated, dependency-resolved) —
    the route is genuinely registered.
  - For search and notification routes (no permission guard), the response
    is HTTP 200 with success=False (stub envelope) — also confirming
    route registration.

This file does NOT test:
  - Response body correctness (covered in test_controller_stubs.py).
  - Schema validation (covered in test_schemas.py).
  - Service logic (NotImplementedError by design; tests deferred).

TestClient note: starlette's TestClient runs the ASGI app synchronously
inside a thread with its own event loop.  No pytest-asyncio marks needed.
"""

import uuid

import pytest

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# client fixture comes from conftest.py (scope="module")
# ---------------------------------------------------------------------------


# Reusable path UUIDs
_DOC_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
_PERM_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
_NOTIF_ID = "cccccccc-cccc-4ccc-cccc-cccccccccccc"


# ===========================================================================
# Convenience — assert route registered (501 or 200 are both OK; 404 is NOT)
# ===========================================================================

def _assert_registered(response, method, path):
    """
    A route is considered registered if it does NOT return 404 or 405.
    501 = middleware guard hit (route reached), 200 = stub response (route reached),
    422 = schema validation ran (route reached, params were wrong shape — only
    happens for GET params in these tests, which is fine).
    """
    assert response.status_code != 404, (
        f"{method} {path} returned 404 — route not registered."
    )
    assert response.status_code != 405, (
        f"{method} {path} returned 405 — wrong HTTP method."
    )


# ===========================================================================
# Permissions & Sharing routes (5)
# ===========================================================================


class TestPermissionRouteRegistration:

    def test_post_share(self, client):
        path = f"/api/documents/{_DOC_ID}/share"
        resp = client.post(
            path,
            json={
                "user_id": str(uuid.uuid4()),
                "permission_level": "viewer",
            },
        )
        _assert_registered(resp, "POST", path)
        # Guard stub raises 501 while permission_service.can_share is not implemented
        assert resp.status_code == 501

    def test_get_permissions(self, client):
        path = f"/api/documents/{_DOC_ID}/permissions"
        resp = client.get(path)
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 501   # require_can_view guard → 501

    def test_put_permission(self, client):
        path = f"/api/documents/{_DOC_ID}/permissions/{_PERM_ID}"
        resp = client.put(
            path,
            json={"permission_level": "editor"},
        )
        _assert_registered(resp, "PUT", path)
        assert resp.status_code == 501

    def test_delete_permission(self, client):
        path = f"/api/documents/{_DOC_ID}/permissions/{_PERM_ID}"
        resp = client.delete(path)
        _assert_registered(resp, "DELETE", path)
        assert resp.status_code == 501

    def test_post_link_sharing(self, client):
        path = f"/api/documents/{_DOC_ID}/link_sharing"
        resp = client.post(path, json={"enabled": True})
        _assert_registered(resp, "POST", path)
        assert resp.status_code == 501


# ===========================================================================
# Search routes (4)
# ===========================================================================


class TestSearchRouteRegistration:
    """
    Search routes have no permission guard — only the auth dependency
    (returns sentinel UUID via conftest override).
    All return HTTP 200 with the stub envelope.
    """

    def test_get_search(self, client):
        path = "/api/search"
        resp = client.get(path, params={"query": "test"})
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is False         # stub
        assert "data" in body
        assert isinstance(body["data"], dict)
        assert "items" in body["data"]

    def test_get_search_requires_query_param(self, client):
        """Missing required `query` param → 422 Unprocessable Entity (route IS registered)."""
        resp = client.get("/api/search")
        assert resp.status_code == 422          # validation ran → route registered

    def test_get_search_documents(self, client):
        path = "/api/search/documents"
        resp = client.get(path, params={"query": "roadmap"})
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200

    def test_get_search_folders(self, client):
        path = "/api/search/folders"
        resp = client.get(path, params={"query": "assets"})
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200

    def test_get_search_users(self, client):
        path = "/api/search/users"
        resp = client.get(path, params={"query": "fatima"})
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200


# ===========================================================================
# Notification routes (5)
# ===========================================================================


class TestNotificationRouteRegistration:
    """
    Notification routes have no permission guard.
    All return HTTP 200 with the stub envelope.
    """

    def test_get_notifications(self, client):
        path = "/api/notifications"
        resp = client.get(path)
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200
        body = resp.json()
        assert "success" in body
        assert "message" in body
        assert "data" in body

    def test_get_notifications_unread(self, client):
        path = "/api/notifications/unread"
        resp = client.get(path)
        _assert_registered(resp, "GET", path)
        assert resp.status_code == 200

    def test_put_read_all(self, client):
        """
        read_all must be registered BEFORE /{notification_id}/read.
        If path ordering is wrong, FastAPI will try to parse 'read_all'
        as a UUID and return 422, which is still not 404, but we assert
        200 explicitly to catch the ordering bug.
        """
        path = "/api/notifications/read_all"
        resp = client.put(path)
        _assert_registered(resp, "PUT", path)
        assert resp.status_code == 200, (
            "Expected 200 from read_all stub. If 422, path ordering is broken "
            "(FastAPI is treating 'read_all' as a UUID param)."
        )

    def test_put_notification_read(self, client):
        path = f"/api/notifications/{_NOTIF_ID}/read"
        resp = client.put(path)
        _assert_registered(resp, "PUT", path)
        assert resp.status_code == 200

    def test_delete_notification(self, client):
        path = f"/api/notifications/{_NOTIF_ID}"
        resp = client.delete(path)
        _assert_registered(resp, "DELETE", path)
        assert resp.status_code == 200


# ===========================================================================
# Full route inventory via OpenAPI spec
# ===========================================================================


class TestOpenApiRouteInventory:
    """
    Parse /openapi.json to assert that all 15 expected paths are present.
    This is the most structural test — it catches a router include_router()
    being accidentally removed from main.py.
    """

    EXPECTED_PATHS = {
        f"/api/documents/{{document_id}}/share",
        f"/api/documents/{{document_id}}/permissions",
        f"/api/documents/{{document_id}}/permissions/{{permission_id}}",
        f"/api/documents/{{document_id}}/link_sharing",
        "/api/search",
        "/api/search/documents",
        "/api/search/folders",
        "/api/search/users",
        "/api/notifications",
        "/api/notifications/unread",
        "/api/notifications/read_all",
        "/api/notifications/{notification_id}/read",
        "/api/notifications/{notification_id}",
    }

    def test_all_paths_in_openapi(self, client):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        spec = resp.json()
        registered = set(spec.get("paths", {}).keys())

        missing = self.EXPECTED_PATHS - registered
        assert not missing, (
            f"The following paths are missing from OpenAPI spec:\n"
            + "\n".join(f"  - {p}" for p in sorted(missing))
        )

    def test_owned_path_count(self, client):
        """
        This module owns exactly 13 distinct path strings (some share PUT+DELETE).
        The OpenAPI spec counts unique path strings, not method+path combos.
        Assert at least 13 are registered (the +2 from / and /api/health/database
        are from teammates and don't affect this count).
        """
        resp = client.get("/openapi.json")
        spec = resp.json()
        owned = [
            p for p in spec.get("paths", {}).keys()
            if p.startswith("/api/documents")
            or p.startswith("/api/search")
            or p.startswith("/api/notifications")
        ]
        assert len(owned) >= 13, (
            f"Expected at least 13 owned path strings in OpenAPI, found {len(owned)}: {owned}"
        )
