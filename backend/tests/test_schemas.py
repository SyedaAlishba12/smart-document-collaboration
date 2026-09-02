"""
tests/test_schemas.py — Schema validation tests.

Coverage:
  - permission_schema: ShareDocumentRequest, UpdatePermissionRequest,
                       LinkSharingRequest, PermissionResponse, LinkSharingResponse
  - notification_schema: NotificationResponse, NotificationListResponse, MarkReadRequest
  - search_schema: SearchQueryParams, SearchResultItem, SearchResultResponse

Strategy
--------
Each schema class gets two groups of tests:
  1. "valid" tests — assert that well-formed data round-trips without error.
  2. "invalid" tests — assert that malformed data raises pydantic.ValidationError,
     and where useful, that the error targets the correct field.

Why no service / DB: Pydantic validation is pure Python — no DB, no async,
no FastAPI needed.  These tests will remain stable after model merge.
"""

import uuid
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

# ---------------------------------------------------------------------------
# Import the schemas under test
# ---------------------------------------------------------------------------

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from schemas.permission_schema import (
    LinkSharingRequest,
    LinkSharingResponse,
    PermissionResponse,
    ShareDocumentRequest,
    UpdatePermissionRequest,
)
from schemas.notification_schema import (
    MarkReadRequest,
    NotificationListResponse,
    NotificationResponse,
)
from schemas.search_schema import (
    SearchQueryParams,
    SearchResultItem,
    SearchResultResponse,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_NOW = datetime(2026, 8, 26, 0, 0, 0, tzinfo=timezone.utc)
_UUID_A = uuid.uuid4()
_UUID_B = uuid.uuid4()
_UUID_C = uuid.uuid4()


# ===========================================================================
# permission_schema — ShareDocumentRequest
# ===========================================================================


class TestShareDocumentRequest:
    def test_valid_minimal(self):
        """Only required fields — sharing_scope and message get defaults."""
        data = ShareDocumentRequest(
            user_id=_UUID_A,
            permission_level="editor",
        )
        assert data.user_id == _UUID_A
        assert data.permission_level == "editor"
        assert data.sharing_scope == "private"   # default
        assert data.message is None              # default

    def test_valid_full(self):
        """All fields provided, including optional ones."""
        data = ShareDocumentRequest(
            user_id=_UUID_A,
            permission_level="commenter",
            sharing_scope="workspace",
            message="Hi, here is the doc.",
        )
        assert data.sharing_scope == "workspace"
        assert data.message == "Hi, here is the doc."

    def test_invalid_missing_user_id(self):
        with pytest.raises(ValidationError) as exc_info:
            ShareDocumentRequest(permission_level="viewer")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("user_id",) for e in errors)

    def test_invalid_missing_permission_level(self):
        with pytest.raises(ValidationError) as exc_info:
            ShareDocumentRequest(user_id=_UUID_A)
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("permission_level",) for e in errors)

    def test_invalid_permission_level_value(self):
        """'superadmin' is not a valid PermissionLevelLiteral."""
        with pytest.raises(ValidationError) as exc_info:
            ShareDocumentRequest(user_id=_UUID_A, permission_level="superadmin")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("permission_level",) for e in errors)

    def test_invalid_sharing_scope_value(self):
        with pytest.raises(ValidationError):
            ShareDocumentRequest(
                user_id=_UUID_A,
                permission_level="editor",
                sharing_scope="public",   # not in the literal
            )

    def test_invalid_user_id_not_uuid(self):
        with pytest.raises(ValidationError):
            ShareDocumentRequest(user_id="not-a-uuid", permission_level="viewer")

    def test_message_max_length(self):
        """message has max_length=500."""
        with pytest.raises(ValidationError) as exc_info:
            ShareDocumentRequest(
                user_id=_UUID_A,
                permission_level="viewer",
                message="x" * 501,
            )
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("message",) for e in errors)

    def test_message_at_max_length_is_valid(self):
        data = ShareDocumentRequest(
            user_id=_UUID_A,
            permission_level="viewer",
            message="x" * 500,
        )
        assert len(data.message) == 500


# ===========================================================================
# permission_schema — UpdatePermissionRequest
# ===========================================================================


class TestUpdatePermissionRequest:
    def test_valid_level_only(self):
        data = UpdatePermissionRequest(permission_level="viewer")
        assert data.permission_level == "viewer"
        assert data.sharing_scope is None

    def test_valid_scope_only(self):
        data = UpdatePermissionRequest(sharing_scope="anyone_with_link")
        assert data.sharing_scope == "anyone_with_link"
        assert data.permission_level is None

    def test_valid_both_null(self):
        """Both optional — schema itself allows it; controller enforces at-least-one."""
        data = UpdatePermissionRequest()
        assert data.permission_level is None
        assert data.sharing_scope is None

    def test_invalid_permission_level_value(self):
        with pytest.raises(ValidationError):
            UpdatePermissionRequest(permission_level="god_mode")

    def test_invalid_scope_value(self):
        with pytest.raises(ValidationError):
            UpdatePermissionRequest(sharing_scope="global")


# ===========================================================================
# permission_schema — LinkSharingRequest
# ===========================================================================


class TestLinkSharingRequest:
    def test_valid_enabled_true(self):
        data = LinkSharingRequest(enabled=True)
        assert data.enabled is True
        assert data.link_permission_level == "viewer"  # default

    def test_valid_enabled_false(self):
        data = LinkSharingRequest(enabled=False)
        assert data.enabled is False

    def test_valid_with_explicit_level(self):
        data = LinkSharingRequest(enabled=True, link_permission_level="editor")
        assert data.link_permission_level == "editor"

    def test_invalid_missing_enabled(self):
        with pytest.raises(ValidationError) as exc_info:
            LinkSharingRequest()
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("enabled",) for e in errors)

    def test_invalid_link_level_value(self):
        with pytest.raises(ValidationError):
            LinkSharingRequest(enabled=True, link_permission_level="write")


# ===========================================================================
# permission_schema — PermissionResponse
# ===========================================================================


class TestPermissionResponse:
    def _make(self, **overrides):
        defaults = dict(
            id=_UUID_A,
            resource_type="document",
            resource_id=_UUID_B,
            user_id=_UUID_C,
            permission_level="editor",
            sharing_scope="private",
            granted_by=_UUID_A,
            created_at=_NOW,
            updated_at=_NOW,
        )
        return PermissionResponse(**{**defaults, **overrides})

    def test_valid(self):
        data = self._make()
        assert data.resource_type == "document"
        assert data.permission_level == "editor"

    def test_invalid_resource_type(self):
        with pytest.raises(ValidationError):
            self._make(resource_type="workspace")

    def test_invalid_permission_level(self):
        with pytest.raises(ValidationError):
            self._make(permission_level="admin")

    def test_missing_required_field(self):
        with pytest.raises(ValidationError):
            PermissionResponse(
                resource_type="document",
                resource_id=_UUID_B,
                # user_id omitted
                permission_level="viewer",
                sharing_scope="private",
                granted_by=_UUID_A,
                created_at=_NOW,
                updated_at=_NOW,
            )


# ===========================================================================
# permission_schema — LinkSharingResponse
# ===========================================================================


class TestLinkSharingResponse:
    def test_valid_enabled(self):
        data = LinkSharingResponse(
            enabled=True,
            link_permission_level="viewer",
            shareable_link="https://example.com/d/abc",
        )
        assert data.shareable_link == "https://example.com/d/abc"

    def test_valid_disabled(self):
        data = LinkSharingResponse(enabled=False, link_permission_level=None)
        assert data.enabled is False
        assert data.shareable_link is None  # default

    def test_invalid_link_level(self):
        with pytest.raises(ValidationError):
            LinkSharingResponse(enabled=True, link_permission_level="bad")


# ===========================================================================
# notification_schema — NotificationResponse
# ===========================================================================


class TestNotificationResponse:
    def _make(self, **overrides):
        defaults = dict(
            id=_UUID_A,
            user_id=_UUID_B,
            type="mention",
            resource_type="document",
            resource_id=_UUID_C,
            message="You were mentioned.",
            is_read=False,
            created_at=_NOW,
        )
        return NotificationResponse(**{**defaults, **overrides})

    def test_valid(self):
        data = self._make()
        assert data.type == "mention"
        assert data.is_read is False

    def test_valid_all_types(self):
        """All six NotificationTypeLiteral values should be accepted."""
        for t in ("mention", "share", "comment", "reply", "permission_change", "document_update"):
            data = self._make(type=t)
            assert data.type == t

    def test_invalid_type(self):
        with pytest.raises(ValidationError) as exc_info:
            self._make(type="like")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("type",) for e in errors)

    def test_invalid_missing_message(self):
        with pytest.raises(ValidationError) as exc_info:
            NotificationResponse(
                id=_UUID_A,
                user_id=_UUID_B,
                type="share",
                resource_type="document",
                resource_id=_UUID_C,
                # message omitted
                is_read=False,
                created_at=_NOW,
            )
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("message",) for e in errors)

    def test_resource_type_is_free_string(self):
        """resource_type is str, not an enum — any string is valid."""
        data = self._make(resource_type="comment")
        assert data.resource_type == "comment"
        data2 = self._make(resource_type="workspace_invite")
        assert data2.resource_type == "workspace_invite"


# ===========================================================================
# notification_schema — NotificationListResponse
# ===========================================================================


class TestNotificationListResponse:
    def _notification(self):
        return NotificationResponse(
            id=uuid.uuid4(),
            user_id=_UUID_A,
            type="share",
            resource_type="document",
            resource_id=uuid.uuid4(),
            message="Shared with you.",
            is_read=False,
            created_at=_NOW,
        )

    def test_valid_with_items(self):
        n = self._notification()
        data = NotificationListResponse(total=1, limit=20, offset=0, items=[n])
        assert data.total == 1
        assert len(data.items) == 1

    def test_valid_empty(self):
        data = NotificationListResponse(total=0, limit=20, offset=0, items=[])
        assert data.items == []

    def test_invalid_missing_total(self):
        with pytest.raises(ValidationError) as exc_info:
            NotificationListResponse(limit=20, offset=0, items=[])
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("total",) for e in errors)


# ===========================================================================
# notification_schema — MarkReadRequest
# ===========================================================================


class TestMarkReadRequest:
    def test_valid(self):
        ids = [uuid.uuid4(), uuid.uuid4()]
        data = MarkReadRequest(notification_ids=ids)
        assert len(data.notification_ids) == 2

    def test_valid_empty_list(self):
        data = MarkReadRequest(notification_ids=[])
        assert data.notification_ids == []

    def test_invalid_missing_field(self):
        with pytest.raises(ValidationError) as exc_info:
            MarkReadRequest()
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("notification_ids",) for e in errors)

    def test_invalid_non_uuid_in_list(self):
        with pytest.raises(ValidationError):
            MarkReadRequest(notification_ids=["not-a-uuid"])


# ===========================================================================
# search_schema — SearchQueryParams
# ===========================================================================


class TestSearchQueryParams:
    def test_valid_minimal(self):
        data = SearchQueryParams(query="roadmap")
        assert data.query == "roadmap"
        assert data.limit == 20     # default
        assert data.offset == 0     # default
        assert data.workspace_id is None
        assert data.file_type is None
        assert data.resource_kind is None

    def test_valid_full(self):
        ws = uuid.uuid4()
        data = SearchQueryParams(
            query="design",
            workspace_id=ws,
            file_type="pdf",
            resource_kind="document",
            limit=50,
            offset=100,
        )
        assert data.workspace_id == ws
        assert data.file_type == "pdf"
        assert data.resource_kind == "document"
        assert data.limit == 50
        assert data.offset == 100

    def test_invalid_empty_query(self):
        """query has min_length=1."""
        with pytest.raises(ValidationError) as exc_info:
            SearchQueryParams(query="")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("query",) for e in errors)

    def test_invalid_query_too_long(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="x" * 501)

    def test_invalid_missing_query(self):
        with pytest.raises(ValidationError) as exc_info:
            SearchQueryParams()
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("query",) for e in errors)

    def test_invalid_resource_kind(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="q", resource_kind="workspace")

    def test_invalid_limit_too_high(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="q", limit=101)

    def test_invalid_limit_zero(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="q", limit=0)

    def test_invalid_offset_negative(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="q", offset=-1)

    def test_valid_file_type_max_length(self):
        """file_type max 50 chars."""
        data = SearchQueryParams(query="q", file_type="x" * 50)
        assert len(data.file_type) == 50

    def test_invalid_file_type_too_long(self):
        with pytest.raises(ValidationError):
            SearchQueryParams(query="q", file_type="x" * 51)

    def test_valid_resource_kind_all_values(self):
        for kind in ("document", "folder", "user"):
            data = SearchQueryParams(query="q", resource_kind=kind)
            assert data.resource_kind == kind


# ===========================================================================
# search_schema — SearchResultItem
# ===========================================================================


class TestSearchResultItem:
    def test_valid_minimal(self):
        data = SearchResultItem(id=_UUID_A, kind="document", title="My Doc")
        assert data.kind == "document"
        assert data.owner_id is None
        assert data.file_type is None
        assert data.extra is None

    def test_valid_all_kinds(self):
        for k in ("document", "folder", "user"):
            data = SearchResultItem(id=uuid.uuid4(), kind=k, title="X")
            assert data.kind == k

    def test_invalid_kind(self):
        with pytest.raises(ValidationError) as exc_info:
            SearchResultItem(id=_UUID_A, kind="workspace", title="X")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("kind",) for e in errors)

    def test_invalid_missing_title(self):
        with pytest.raises(ValidationError) as exc_info:
            SearchResultItem(id=_UUID_A, kind="folder")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("title",) for e in errors)

    def test_extra_field_accepted(self):
        data = SearchResultItem(
            id=_UUID_A, kind="document", title="Doc",
            extra={"highlight": "...roadmap..."}
        )
        assert data.extra["highlight"] == "...roadmap..."


# ===========================================================================
# search_schema — SearchResultResponse
# ===========================================================================


class TestSearchResultResponse:
    def test_valid_empty(self):
        data = SearchResultResponse(query="q", total=0, limit=20, offset=0, items=[])
        assert data.items == []
        assert data.query == "q"

    def test_valid_with_items(self):
        item = SearchResultItem(id=uuid.uuid4(), kind="folder", title="Assets")
        data = SearchResultResponse(query="assets", total=1, limit=20, offset=0, items=[item])
        assert len(data.items) == 1
        assert data.total == 1

    def test_invalid_missing_query(self):
        with pytest.raises(ValidationError) as exc_info:
            SearchResultResponse(total=0, limit=20, offset=0, items=[])
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("query",) for e in errors)
