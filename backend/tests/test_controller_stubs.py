"""
tests/test_controller_stubs.py — Controller stub-behaviour tests.

What is tested
--------------
1. NotImplementedError from a service stub → controller returns a dict
   with success=False and a message containing "not yet implemented".
   (The route layer would surface this as HTTP 200; we test the controller
   function directly, below the HTTP layer, so no TestClient is needed.)

2. LookupError from a service stub → controller raises HTTPException with
   status_code=404.  Tested for the three controllers that have this branch:
     - permission_controller.revoke_document_permission
     - notification_controller.mark_notification_read
     - notification_controller.delete_notification

3. The search controller always returns a SearchResultResponse-shaped dict
   with success=False without calling any service function (it is a pure stub).

Strategy
--------
Service functions are patched via unittest.mock.AsyncMock so tests run
without a real DB session or event loop ceremony.  Controllers are async
functions; pytest-asyncio's `asyncio` mode is used to await them.

NOTE: We do NOT test what happens *after* the stub returns a real result
(i.e. we don't test PermissionResponse.model_validate(), etc.) because
those paths depend on User/Document models that don't exist yet.
"""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from controllers import (
    notification_controller,
    permission_controller,
    search_controller,
)
from schemas.search_schema import SearchResultResponse
from schemas.permission_schema import (
    LinkSharingRequest,
    ShareDocumentRequest,
    UpdatePermissionRequest,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DOC_ID = uuid.uuid4()
_PERM_ID = uuid.uuid4()
_NOTIF_ID = uuid.uuid4()
_USER_ID = uuid.uuid4()

pytestmark = pytest.mark.asyncio


def _fake_db():
    return MagicMock()


# ===========================================================================
# permission_controller — NotImplementedError → success: False envelope
# ===========================================================================


class TestPermissionControllerStubs:
    """
    All permission service functions currently raise NotImplementedError.
    The controller must catch each one and return the standard envelope
    with success=False and a message that contains "not yet implemented".
    """

    async def test_share_document_stub(self):
        body = ShareDocumentRequest(user_id=_USER_ID, permission_level="editor")
        with patch(
            "controllers.permission_controller.permission_service.grant_permission",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await permission_controller.share_document(
                db=_fake_db(),
                document_id=_DOC_ID,
                body=body,
                current_user_id=_USER_ID,
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]
        assert result["data"] is None

    async def test_get_document_permissions_stub(self):
        """list_permissions stub — no service call needed; controller is a pure stub."""
        result = await permission_controller.get_document_permissions(
            db=_fake_db(),
            document_id=_DOC_ID,
            current_user_id=_USER_ID,
        )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_update_permission_stub(self):
        body = UpdatePermissionRequest(permission_level="viewer")
        result = await permission_controller.update_permission(
            db=_fake_db(),
            document_id=_DOC_ID,
            permission_id=_PERM_ID,
            body=body,
            current_user_id=_USER_ID,
        )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_revoke_permission_stub_not_implemented(self):
        with patch(
            "controllers.permission_controller.permission_service.revoke_permission",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await permission_controller.revoke_document_permission(
                db=_fake_db(),
                document_id=_DOC_ID,
                permission_id=_PERM_ID,
                current_user_id=_USER_ID,
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_revoke_permission_lookup_error_raises_404(self):
        """
        LookupError from revoke_permission → HTTPException(404).
        The 404 path is wired in the controller now so it fires
        automatically once the service is implemented.
        """
        with patch(
            "controllers.permission_controller.permission_service.revoke_permission",
            new=AsyncMock(side_effect=LookupError("not found")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await permission_controller.revoke_document_permission(
                    db=_fake_db(),
                    document_id=_DOC_ID,
                    permission_id=_PERM_ID,
                    current_user_id=_USER_ID,
                )
        assert exc_info.value.status_code == 404

    async def test_configure_link_sharing_stub(self):
        body = LinkSharingRequest(enabled=True, link_permission_level="viewer")
        result = await permission_controller.configure_link_sharing(
            db=_fake_db(),
            document_id=_DOC_ID,
            body=body,
            current_user_id=_USER_ID,
        )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]


# ===========================================================================
# notification_controller — NotImplementedError → success: False
#                         — LookupError → HTTPException 404
# ===========================================================================


class TestNotificationControllerStubs:

    async def test_list_notifications_stub(self):
        with patch(
            "controllers.notification_controller.notification_service.get_user_notifications",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await notification_controller.list_notifications(
                db=_fake_db(), current_user_id=_USER_ID
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]
        assert result["data"] is None

    async def test_list_unread_notifications_stub(self):
        with patch(
            "controllers.notification_controller.notification_service.get_user_notifications",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await notification_controller.list_unread_notifications(
                db=_fake_db(), current_user_id=_USER_ID
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_mark_notification_read_stub(self):
        with patch(
            "controllers.notification_controller.notification_service.mark_as_read",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await notification_controller.mark_notification_read(
                db=_fake_db(),
                notification_id=_NOTIF_ID,
                current_user_id=_USER_ID,
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_mark_notification_read_lookup_error_raises_404(self):
        with patch(
            "controllers.notification_controller.notification_service.mark_as_read",
            new=AsyncMock(side_effect=LookupError("no such notification")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await notification_controller.mark_notification_read(
                    db=_fake_db(),
                    notification_id=_NOTIF_ID,
                    current_user_id=_USER_ID,
                )
        assert exc_info.value.status_code == 404

    async def test_mark_all_read_stub(self):
        with patch(
            "controllers.notification_controller.notification_service.mark_all_as_read",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await notification_controller.mark_all_notifications_read(
                db=_fake_db(), current_user_id=_USER_ID
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_delete_notification_stub(self):
        with patch(
            "controllers.notification_controller.notification_service.delete_notification",
            new=AsyncMock(side_effect=NotImplementedError),
        ):
            result = await notification_controller.delete_notification(
                db=_fake_db(),
                notification_id=_NOTIF_ID,
                current_user_id=_USER_ID,
            )
        assert result["success"] is False
        assert "not yet implemented" in result["message"]

    async def test_delete_notification_lookup_error_raises_404(self):
        with patch(
            "controllers.notification_controller.notification_service.delete_notification",
            new=AsyncMock(side_effect=LookupError("not found")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await notification_controller.delete_notification(
                    db=_fake_db(),
                    notification_id=_NOTIF_ID,
                    current_user_id=_USER_ID,
                )
        assert exc_info.value.status_code == 404

    async def test_mark_all_read_returns_updated_count_key_when_implemented(self):
        """
        When mark_all_as_read returns a real count (not NotImplementedError),
        the controller should put it in data['updated_count'].
        This test validates the controller's response-shaping logic for the
        future live path without needing a real DB.
        """
        with patch(
            "controllers.notification_controller.notification_service.mark_all_as_read",
            new=AsyncMock(return_value=7),
        ):
            result = await notification_controller.mark_all_notifications_read(
                db=_fake_db(), current_user_id=_USER_ID
            )
        assert result["success"] is True
        assert result["data"]["updated_count"] == 7
        assert "7" in result["message"]


# ===========================================================================
# search_controller — always returns stub envelope; no service call at all
# ===========================================================================


class TestSearchControllerStubs:
    """
    The search controller has no service module yet — it directly returns
    an empty SearchResultResponse with success=False.  These tests confirm
    that shape is stable.
    """

    async def test_global_search_stub(self):
        result = await search_controller.global_search(
            db=_fake_db(),
            current_user_id=_USER_ID,
            query="roadmap",
            workspace_id=None,
            file_type=None,
            resource_kind=None,
            limit=20,
            offset=0,
        )
        assert result["success"] is False
        # data is a SearchResultResponse Pydantic model — use attribute access
        data = result["data"]
        assert isinstance(data, SearchResultResponse)
        assert data.items == []
        assert data.query == "roadmap"
        assert data.total == 0

    async def test_search_documents_stub(self):
        result = await search_controller.search_documents(
            db=_fake_db(),
            current_user_id=_USER_ID,
            query="q3",
            workspace_id=None,
            file_type=None,
            limit=20,
            offset=0,
        )
        assert result["success"] is False
        assert isinstance(result["data"], SearchResultResponse)
        assert result["data"].items == []

    async def test_search_folders_stub(self):
        result = await search_controller.search_folders(
            db=_fake_db(),
            current_user_id=_USER_ID,
            query="assets",
            workspace_id=None,
            limit=20,
            offset=0,
        )
        assert result["success"] is False

    async def test_search_users_stub(self):
        result = await search_controller.search_users(
            db=_fake_db(),
            current_user_id=_USER_ID,
            query="fatima",
            workspace_id=None,
            limit=20,
            offset=0,
        )
        assert result["success"] is False
        assert isinstance(result["data"], SearchResultResponse)
        assert result["data"].items == []

    async def test_stub_data_is_always_search_result_response_not_none(self):
        """
        Frontend reads data.items without null-checking.
        Confirm all four search stubs return data as a SearchResultResponse
        Pydantic model (never None), with an accessible .items list.
        Use asyncio.gather so all four coroutines are properly awaited.
        """
        results = await asyncio.gather(
            search_controller.global_search(
                db=_fake_db(), current_user_id=_USER_ID,
                query="x", workspace_id=None, file_type=None,
                resource_kind=None, limit=1, offset=0,
            ),
            search_controller.search_documents(
                db=_fake_db(), current_user_id=_USER_ID,
                query="x", workspace_id=None, file_type=None, limit=1, offset=0,
            ),
            search_controller.search_folders(
                db=_fake_db(), current_user_id=_USER_ID,
                query="x", workspace_id=None, limit=1, offset=0,
            ),
            search_controller.search_users(
                db=_fake_db(), current_user_id=_USER_ID,
                query="x", workspace_id=None, limit=1, offset=0,
            ),
        )
        for result in results:
            assert isinstance(result["data"], SearchResultResponse), (
                f"Expected SearchResultResponse, got {type(result['data'])}"
            )
            assert result["data"].items == []  # attribute access on Pydantic model
