"""
Standalone async integration test for permission_service and notification_service.
Uses SQLite in-memory via aiosqlite with FK enforcement disabled.

This script registers minimal stub models for Document and User (which live on
other branches) so SQLAlchemy's relationship resolver doesn't fail.
"""

import asyncio
import sys
import uuid
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlalchemy as sa
from sqlalchemy import event
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Import Base FIRST so all models register against the same metadata.
from database.base import Base

# ── Stub models (satisfy relationship() and FK resolution) ──────────────────
# These are lightweight stand-ins for models that live on other branches.
# They are only used to satisfy SQLAlchemy's mapper configuration; they are
# NOT an authoritative implementation of those models.

class User(Base):
    __tablename__ = "user"
    id = sa.Column(sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

class Document(Base):
    __tablename__ = "documents"
    id = sa.Column(sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = sa.Column(sa.String(36))
    workspace_id = sa.Column(sa.String(36))
    # Provide the back_populates target that Permission.document expects.
    permissions = relationship("Permission", back_populates="document")

# Now import the real models — they will find _StubDocument via the class registry.
from models.permission import Permission, PermissionLevel, SharingScope
from models.notification import Notification, NotificationType

import services.permission_service as psvc
import services.notification_service as nsvc

# ── Test harness ────────────────────────────────────────────────────────────
PASS = "PASS"
FAIL = "FAIL"
_results = []


def check(label, condition):
    status = PASS if condition else FAIL
    _results.append((status, label))
    mark = "OK" if condition else "XX"
    print(f"  [{mark}] {label}")


def check_raises(label, exc_type, got_exc):
    ok = got_exc is not None and isinstance(got_exc, exc_type)
    status = PASS if ok else FAIL
    _results.append((status, label))
    mark = "OK" if ok else "XX"
    detail = f"(got {type(got_exc).__name__})" if got_exc else "(no exception)"
    print(f"  [{mark}] {label} {detail}")


# ── Engine ──────────────────────────────────────────────────────────────────
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(DATABASE_URL, echo=False)


@event.listens_for(engine.sync_engine, "connect")
def _disable_fk(dbapi_conn, _conn_record):
    dbapi_conn.execute("PRAGMA foreign_keys=OFF")


AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── Permission service tests ────────────────────────────────────────────────
async def test_permission_service():
    print("\n=== PERMISSION SERVICE TESTS ===")
    user_id = uuid.uuid4()
    other_user_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    doc2_id = uuid.uuid4()
    granter_id = uuid.uuid4()

    async with AsyncSessionLocal() as db:
        async with db.begin():
            viewer_perm = Permission(
                document_id=doc_id, user_id=user_id,
                permission_level=PermissionLevel.viewer,
                granted_by=granter_id, sharing_scope=SharingScope.private,
            )
            db.add(viewer_perm)
            await db.flush()

            print("\n-- can_view --")
            check("viewer can view", await psvc.can_view(db, user_id, "document", doc_id))
            check("unknown user cannot view", not await psvc.can_view(db, other_user_id, "document", doc_id))
            check("unsupported resource_type returns False", not await psvc.can_view(db, user_id, "folder", doc_id))

            print("\n-- can_comment --")
            check("viewer cannot comment", not await psvc.can_comment(db, user_id, "document", doc_id))

            commenter_perm = Permission(
                document_id=doc2_id, user_id=user_id,
                permission_level=PermissionLevel.commenter,
                granted_by=granter_id, sharing_scope=SharingScope.private,
            )
            db.add(commenter_perm)
            await db.flush()
            check("commenter can comment", await psvc.can_comment(db, user_id, "document", doc2_id))
            check("unsupported resource_type returns False (comment)", not await psvc.can_comment(db, user_id, "folder", doc2_id))

            print("\n-- can_edit --")
            check("viewer cannot edit", not await psvc.can_edit(db, user_id, "document", doc_id))
            check("commenter cannot edit", not await psvc.can_edit(db, user_id, "document", doc2_id))

            print("\n-- can_share --")
            check("viewer cannot share", not await psvc.can_share(db, user_id, "document", doc_id))

            print("\n-- can_delete --")
            check("viewer cannot delete", not await psvc.can_delete(db, user_id, "document", doc_id))

            print("\n-- can_restore_version --")
            check("viewer cannot restore version", not await psvc.can_restore_version(db, user_id, "document", doc_id))

    print("\n-- grant_permission (new insert) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            user3 = uuid.uuid4(); doc3 = uuid.uuid4()
            perm = await psvc.grant_permission(db, "document", doc3, user3, PermissionLevel.editor, granter_id)
            check("grant returns Permission row", isinstance(perm, Permission))
            check("grant level is editor", perm.permission_level == PermissionLevel.editor)
            check("grant has correct user_id", perm.user_id == user3)
            check("editor can edit", await psvc.can_edit(db, user3, "document", doc3))
            check("editor can share", await psvc.can_share(db, user3, "document", doc3))
            check("editor can restore version", await psvc.can_restore_version(db, user3, "document", doc3))
            check("editor cannot delete", not await psvc.can_delete(db, user3, "document", doc3))

    print("\n-- grant_permission (upsert) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            user4 = uuid.uuid4(); doc4 = uuid.uuid4()
            p1 = await psvc.grant_permission(db, "document", doc4, user4, PermissionLevel.editor, granter_id)
            p1_id = p1.id
            p2 = await psvc.grant_permission(db, "document", doc4, user4, PermissionLevel.owner, granter_id)
            check("upsert returns same row id", p1_id == p2.id)
            check("upsert upgrades level to owner", p2.permission_level == PermissionLevel.owner)
            check("owner can delete", await psvc.can_delete(db, user4, "document", doc4))

    print("\n-- grant_permission (unsupported resource_type) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            exc = None
            try:
                await psvc.grant_permission(db, "folder", uuid.uuid4(), uuid.uuid4(), PermissionLevel.editor, granter_id)
            except ValueError as e:
                exc = e
            check_raises("grant_permission('folder') raises ValueError", ValueError, exc)

    print("\n-- revoke_permission --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            user5 = uuid.uuid4(); doc5 = uuid.uuid4()
            perm = await psvc.grant_permission(db, "document", doc5, user5, PermissionLevel.viewer, granter_id)
            perm_id = perm.id
            check("view before revoke", await psvc.can_view(db, user5, "document", doc5))
            await psvc.revoke_permission(db, perm_id)
            check("cannot view after revoke", not await psvc.can_view(db, user5, "document", doc5))

    async with AsyncSessionLocal() as db:
        async with db.begin():
            exc = None
            try:
                await psvc.revoke_permission(db, uuid.uuid4())
            except LookupError as e:
                exc = e
            check_raises("revoke non-existent row raises LookupError", LookupError, exc)


# ── Notification service tests ──────────────────────────────────────────────
async def test_notification_service():
    print("\n=== NOTIFICATION SERVICE TESTS ===")
    user_id = uuid.uuid4()
    other_user_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    print("\n-- create_notification --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            n = await nsvc.create_notification(
                db, user_id, NotificationType.share, "document", doc_id,
                "Alice shared Doc A with you."
            )
            check("returns Notification instance", isinstance(n, Notification))
            check("is_read defaults to False", n.is_read is False)
            check("message stored correctly", n.message == "Alice shared Doc A with you.")
            check("type stored correctly", n.type == NotificationType.share)
            notif_id_1 = n.id

            n2 = await nsvc.create_notification(db, user_id, NotificationType.comment, "document", doc_id, "Bob commented.")
            notif_id_2 = n2.id
            n3 = await nsvc.create_notification(db, user_id, NotificationType.mention, "document", doc_id, "Charlie mentioned you.")
            notif_id_3 = n3.id

    print("\n-- get_user_notifications (all) --")
    async with AsyncSessionLocal() as db:
        notifs = await nsvc.get_user_notifications(db, user_id)
        check("returns 3 notifications", len(notifs) == 3)
        check("ordered newest first", notifs[0].id == notif_id_3)
        check("other user gets empty list", len(await nsvc.get_user_notifications(db, other_user_id)) == 0)

    print("\n-- get_user_notifications (unread_only) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            await nsvc.mark_as_read(db, notif_id_3, user_id)
        unread = await nsvc.get_user_notifications(db, user_id, unread_only=True)
        check("unread_only returns 2 after marking 1 read", len(unread) == 2)
        check("all returned are unread", all(not n.is_read for n in unread))

    print("\n-- mark_as_read (ownership guard) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            exc = None
            try:
                await nsvc.mark_as_read(db, notif_id_1, other_user_id)
            except LookupError as e:
                exc = e
            check_raises("mark_as_read by wrong user raises LookupError", LookupError, exc)

    print("\n-- mark_all_as_read --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            count = await nsvc.mark_all_as_read(db, user_id)
            check("mark_all_as_read returns count >= 2", count >= 2)
        all_notifs = await nsvc.get_user_notifications(db, user_id)
        check("all notifications now read", all(n.is_read for n in all_notifs))

    async with AsyncSessionLocal() as db:
        async with db.begin():
            count2 = await nsvc.mark_all_as_read(db, user_id)
            check("second call returns 0 (idempotent)", count2 == 0)

    print("\n-- delete_notification --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            await nsvc.delete_notification(db, notif_id_1, user_id)
        remaining = await nsvc.get_user_notifications(db, user_id)
        check("notification hard-deleted", len(remaining) == 2)
        check("deleted notification absent", all(n.id != notif_id_1 for n in remaining))

    print("\n-- delete_notification (ownership guard) --")
    async with AsyncSessionLocal() as db:
        async with db.begin():
            exc = None
            try:
                await nsvc.delete_notification(db, notif_id_2, other_user_id)
            except LookupError as e:
                exc = e
            check_raises("delete by wrong user raises LookupError", LookupError, exc)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            exc = None
            try:
                await nsvc.delete_notification(db, uuid.uuid4(), user_id)
            except LookupError as e:
                exc = e
            check_raises("delete non-existent row raises LookupError", LookupError, exc)

    print("\n-- get_user_notifications (pagination) --")
    async with AsyncSessionLocal() as db:
        page1 = await nsvc.get_user_notifications(db, user_id, limit=1, offset=0)
        page2 = await nsvc.get_user_notifications(db, user_id, limit=1, offset=1)
        check("limit=1 returns 1 row", len(page1) == 1)
        check("offset=1 returns different row", page1[0].id != page2[0].id)


# ── Main ────────────────────────────────────────────────────────────────────
async def main():
    print("\n=== SERVICE LAYER STANDALONE TEST SUITE ===")
    print("=== in-memory SQLite, no full app boot required ===")
    await init_db()
    await test_permission_service()
    await test_notification_service()

    passed = sum(1 for s, _ in _results if s == PASS)
    failed = sum(1 for s, _ in _results if s == FAIL)
    total = len(_results)
    print(f"\n=== SUMMARY: {passed}/{total} passed ===")
    if failed:
        print(f"=== {failed} FAILED ===")
        for s, label in _results:
            if s == FAIL:
                print(f"  XX {label}")
        sys.exit(1)
    else:
        print("=== All green! ===")


if __name__ == "__main__":
    asyncio.run(main())

