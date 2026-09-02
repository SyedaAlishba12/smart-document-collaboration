"""
Standalone async integration test for search_service.

Focus: permission-aware filtering is the security-critical path.
Uses SQLite in-memory via aiosqlite.  Foreign-key enforcement is disabled so
stub models (Document, Folder, User) don't need real FK targets.

Test structure
--------------
1. Permission security test (CRITICAL):
   - Insert two documents.
   - Grant permission on only one.
   - Assert search returns only the permitted document.
   - Assert the unpermitted document is never returned.

2. ILIKE / partial-match test:
   - Titles with partial matches should return results; non-matching should not.

3. Workspace filter test:
   - Results are further narrowed to the requested workspace_id.

4. Date range filter test:
   - date_from / date_to filter on created_at.

5. Pagination test:
   - limit / offset behave correctly.

6. Folder search test:
   - name partial-match, workspace filter, ordering.

7. User search test:
   - full_name and email partial-match, no permission gate.

8. search_all combined test:
   - Returns items from all three resource types.
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlalchemy as sa
from sqlalchemy import event
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

# Import Base FIRST so every model registers against the same metadata.
from database.base import Base

# ---------------------------------------------------------------------------
# Stub models — minimal stand-ins for models on other branches.
# These mirror the real column shapes confirmed via git show.
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "user"
    # Use postgresql.UUID(as_uuid=True) — same type as Permission.user_id —
    # so SQLite serialises all UUIDs identically (hex-no-dashes) and every
    # FK comparison in the service is type-identical on both sides.
    id = sa.Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = sa.Column(sa.String(255), nullable=True)
    full_name = sa.Column(sa.String(255), nullable=True)


class Document(Base):
    __tablename__ = "documents"
    id            = sa.Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title         = sa.Column(sa.String(255), nullable=False)
    content       = sa.Column(sa.Text, nullable=True)
    owner_id      = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    workspace_id  = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    is_favorite   = sa.Column(sa.Boolean, default=False)
    is_archived   = sa.Column(sa.Boolean, default=False)
    created_at    = sa.Column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at    = sa.Column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    # Back-references that real models' relationship() back_populates chains require.
    #
    # Permission.document    → back_populates="permissions" → need Document.permissions
    # DocumentVersion.document → back_populates="versions"  → need Document.versions
    #
    # Comment has NO document relationship (confirmed: comment.py on this branch
    # does not declare `document = relationship(...)`), so we do NOT add
    # Document.comments here — doing so would break the mapper.
    #
    # DocumentAttachment is not on this branch at all — omit entirely.
    permissions = relationship("Permission",      back_populates="document")
    versions    = relationship("DocumentVersion", back_populates="document")


class Folder(Base):
    __tablename__ = "folders"
    id               = sa.Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name             = sa.Column(sa.String(255), nullable=False)
    workspace_id     = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    parent_folder_id = sa.Column(PG_UUID(as_uuid=True), nullable=True)
    created_at       = sa.Column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at       = sa.Column(
        sa.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


# Import real models (stub classes above will satisfy FK resolution)
from models.permission import Permission, PermissionLevel, SharingScope
import services.search_service as ssvc

# ---------------------------------------------------------------------------
# Test harness
# ---------------------------------------------------------------------------
PASS = "PASS"
FAIL = "FAIL"
_results = []


def check(label: str, condition: bool):
    status = PASS if condition else FAIL
    _results.append((status, label))
    mark = "OK" if condition else "XX"
    print(f"  [{mark}] {label}")


# ---------------------------------------------------------------------------
# Engine / session factory
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_id() -> uuid.UUID:
    """Return a real uuid.UUID — all stub and real columns use UUID(as_uuid=True)."""
    return uuid.uuid4()


def _doc(title: str, workspace_id: uuid.UUID = None, created_at: datetime = None) -> Document:
    return Document(
        id=make_id(),
        title=title,
        content=f"Content of {title}",
        owner_id=make_id(),
        workspace_id=workspace_id or make_id(),
        created_at=created_at or datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _perm(document_id: uuid.UUID, user_id: uuid.UUID) -> Permission:
    """All fields are uuid.UUID — matches Permission's UUID(as_uuid=True) columns."""
    return Permission(
        document_id=document_id,
        user_id=user_id,
        permission_level=PermissionLevel.viewer,
        granted_by=make_id(),
        sharing_scope=SharingScope.private,
    )


# ---------------------------------------------------------------------------
# TEST 1: CRITICAL — permission-aware filtering
# ---------------------------------------------------------------------------

async def test_permission_security():
    print("\n=== TEST 1: PERMISSION-AWARE FILTERING (CRITICAL) ===")
    user_id = make_id()
    ws_id = make_id()

    doc_allowed = _doc("Allowed Document", workspace_id=ws_id)
    doc_forbidden = _doc("Forbidden Document", workspace_id=ws_id)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(doc_allowed)
            db.add(doc_forbidden)
            # Grant permission on doc_allowed ONLY
            db.add(_perm(doc_allowed.id, user_id))
            await db.flush()

        result = await ssvc.search_documents(db, user_id, "Document")

    print(f"  total returned: {result.total}, items: {[i.title for i in result.items]}")

    check(
        "SECURITY: only 1 document returned (not 2)",
        result.total == 1 and len(result.items) == 1,
    )
    check(
        "SECURITY: returned item is the PERMITTED document",
        result.items[0].title == "Allowed Document",
    )
    check(
        "SECURITY: forbidden document NOT in results",
        all(i.title != "Forbidden Document" for i in result.items),
    )


# ---------------------------------------------------------------------------
# TEST 2: ILIKE / partial-match
# ---------------------------------------------------------------------------

async def test_partial_match():
    print("\n=== TEST 2: PARTIAL-MATCH SEARCH ===")
    user_id = make_id()
    ws_id = make_id()

    doc_alpha = _doc("Alpha Project Report", workspace_id=ws_id)
    doc_beta  = _doc("Beta Quarterly Update", workspace_id=ws_id)
    doc_gamma = _doc("Gamma Final Notes", workspace_id=ws_id)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(doc_alpha)
            db.add(doc_beta)
            db.add(doc_gamma)
            # Grant all three to user
            db.add(_perm(doc_alpha.id, user_id))
            db.add(_perm(doc_beta.id, user_id))
            db.add(_perm(doc_gamma.id, user_id))
            await db.flush()

        result_project = await ssvc.search_documents(db, user_id, "Project")
        result_notes   = await ssvc.search_documents(db, user_id, "notes")
        result_xyz     = await ssvc.search_documents(db, user_id, "XYZnonexistent")

    check("'Project' matches 'Alpha Project Report'", result_project.total == 1)
    check("'notes' (lowercase) matches 'Gamma Final Notes' (case-insensitive)", result_notes.total == 1)
    check("nonexistent query returns 0 results", result_xyz.total == 0)


# ---------------------------------------------------------------------------
# TEST 3: workspace_id filter
# ---------------------------------------------------------------------------

async def test_workspace_filter():
    print("\n=== TEST 3: WORKSPACE FILTER ===")
    user_id = make_id()
    ws_a = make_id()
    ws_b = make_id()

    doc_in_a  = _doc("Workspace A Doc", workspace_id=ws_a)
    doc_in_b  = _doc("Workspace B Doc", workspace_id=ws_b)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(doc_in_a)
            db.add(doc_in_b)
            db.add(_perm(doc_in_a.id, user_id))
            db.add(_perm(doc_in_b.id, user_id))
            await db.flush()

        result_a = await ssvc.search_documents(db, user_id, "Workspace", workspace_id=ws_a)
        result_b = await ssvc.search_documents(db, user_id, "Workspace", workspace_id=ws_b)
        result_all = await ssvc.search_documents(db, user_id, "Workspace")

    check("workspace_a filter returns only ws_a doc", result_a.total == 1 and result_a.items[0].title == "Workspace A Doc")
    check("workspace_b filter returns only ws_b doc", result_b.total == 1 and result_b.items[0].title == "Workspace B Doc")
    check("no workspace filter returns both", result_all.total == 2)


# ---------------------------------------------------------------------------
# TEST 4: date range filter
# ---------------------------------------------------------------------------

async def test_date_filter():
    print("\n=== TEST 4: DATE RANGE FILTER ===")
    user_id = make_id()
    ws_id = make_id()

    now = datetime.now(timezone.utc)
    old_doc = _doc("Old Report", workspace_id=ws_id, created_at=now - timedelta(days=30))
    new_doc = _doc("New Report", workspace_id=ws_id, created_at=now)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(old_doc)
            db.add(new_doc)
            db.add(_perm(old_doc.id, user_id))
            db.add(_perm(new_doc.id, user_id))
            await db.flush()

        date_cutoff = now - timedelta(days=10)
        result_recent = await ssvc.search_documents(db, user_id, "Report", date_from=date_cutoff)
        result_old    = await ssvc.search_documents(db, user_id, "Report", date_to=date_cutoff)

    check("date_from filters out old document", result_recent.total == 1 and result_recent.items[0].title == "New Report")
    check("date_to filters out new document", result_old.total == 1 and result_old.items[0].title == "Old Report")


# ---------------------------------------------------------------------------
# TEST 5: pagination
# ---------------------------------------------------------------------------

async def test_pagination():
    print("\n=== TEST 5: PAGINATION ===")
    user_id = make_id()
    ws_id = make_id()

    docs = [_doc(f"Page Doc {i}", workspace_id=ws_id) for i in range(5)]

    async with AsyncSessionLocal() as db:
        async with db.begin():
            for d in docs:
                db.add(d)
                db.add(_perm(d.id, user_id))
            await db.flush()

        page1 = await ssvc.search_documents(db, user_id, "Page Doc", limit=2, offset=0)
        page2 = await ssvc.search_documents(db, user_id, "Page Doc", limit=2, offset=2)
        page3 = await ssvc.search_documents(db, user_id, "Page Doc", limit=2, offset=4)

    check("page1 returns 2 items", len(page1.items) == 2)
    check("page2 returns 2 different items", len(page2.items) == 2 and
          not any(p1.id == p2.id for p1 in page1.items for p2 in page2.items))
    check("page3 returns 1 item (last page)", len(page3.items) == 1)
    check("total is always 5 regardless of page", page1.total == 5 and page2.total == 5)


# ---------------------------------------------------------------------------
# TEST 6: folder search
# ---------------------------------------------------------------------------

async def test_folder_search():
    print("\n=== TEST 6: FOLDER SEARCH ===")
    user_id = make_id()
    ws_x = make_id()
    ws_y = make_id()

    folder_a = Folder(id=make_id(), name="Design Assets",      workspace_id=ws_x,
                      created_at=datetime.now(timezone.utc))
    folder_b = Folder(id=make_id(), name="Design Mockups",     workspace_id=ws_x,
                      created_at=datetime.now(timezone.utc))
    folder_c = Folder(id=make_id(), name="Engineering Specs",  workspace_id=ws_y,
                      created_at=datetime.now(timezone.utc))

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(folder_a)
            db.add(folder_b)
            db.add(folder_c)
            await db.flush()

        result_design    = await ssvc.search_folders(db, user_id, "Design")
        result_ws_x      = await ssvc.search_folders(db, user_id, "Design", workspace_id=ws_x)
        result_ws_y      = await ssvc.search_folders(db, user_id, "Design", workspace_id=ws_y)
        result_no_match  = await ssvc.search_folders(db, user_id, "Nonexistent")

    check("'Design' matches 2 folders", result_design.total == 2)
    check("workspace_x filter returns 2 Design folders", result_ws_x.total == 2)
    check("workspace_y filter returns 0 Design folders", result_ws_y.total == 0)
    check("nonexistent folder query returns 0", result_no_match.total == 0)


# ---------------------------------------------------------------------------
# TEST 7: user search
# ---------------------------------------------------------------------------

async def test_user_search():
    print("\n=== TEST 7: USER SEARCH (NO PERMISSION GATE) ===")

    user_alice = User(id=make_id(), full_name="Alice Johnson", email="alice@example.com")
    user_bob   = User(id=make_id(), full_name="Bob Smith",     email="bob@example.com")
    user_carol = User(id=make_id(), full_name="Carol White",   email="carol.w@corp.io")

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(user_alice)
            db.add(user_bob)
            db.add(user_carol)
            await db.flush()

        result_alice   = await ssvc.search_users(db, "alice")
        result_corp    = await ssvc.search_users(db, "corp.io")
        result_smith   = await ssvc.search_users(db, "Smith")
        result_nothing = await ssvc.search_users(db, "xyz_nobody")

    check("'alice' matches Alice by full_name", result_alice.total >= 1 and
          any("Alice" in i.title for i in result_alice.items))
    check("'corp.io' matches Carol by email", result_corp.total >= 1 and
          any("Carol" in i.title for i in result_corp.items))
    check("'Smith' matches Bob by full_name", result_smith.total >= 1 and
          any("Bob" in i.title for i in result_smith.items))
    check("nonexistent user query returns 0", result_nothing.total == 0)


# ---------------------------------------------------------------------------
# TEST 8: search_all combined
# ---------------------------------------------------------------------------

async def test_search_all():
    print("\n=== TEST 8: SEARCH_ALL COMBINED ===")
    user_id = make_id()
    ws_id = make_id()

    doc = _doc("Quarterly Summary Doc", workspace_id=ws_id)
    folder = Folder(id=make_id(), name="Quarterly Reports Folder",
                    workspace_id=ws_id, created_at=datetime.now(timezone.utc))
    user = User(id=make_id(), full_name="Quarterly Analyst", email="qa@example.com")

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(doc)
            db.add(folder)
            db.add(user)
            db.add(_perm(doc.id, user_id))
            await db.flush()

        result = await ssvc.search_all(db, user_id, "Quarterly", limit=9)

    kinds = {i.kind for i in result.items}
    check("search_all returns items from multiple resource types", len(kinds) >= 2)
    check("search_all includes at least 1 document", any(i.kind == "document" for i in result.items))
    check("search_all includes at least 1 folder", any(i.kind == "folder" for i in result.items))
    check("search_all total >= 2", result.total >= 2)


# ---------------------------------------------------------------------------
# TEST 9: user without any permissions gets nothing
# ---------------------------------------------------------------------------

async def test_no_permission_user():
    print("\n=== TEST 9: USER WITH NO PERMISSIONS GETS ZERO RESULTS ===")
    owner_id   = make_id()
    stranger_id = make_id()
    ws_id = make_id()

    doc = _doc("Owner's Private Document", workspace_id=ws_id)

    async with AsyncSessionLocal() as db:
        async with db.begin():
            db.add(doc)
            db.add(_perm(doc.id, owner_id))   # only owner gets permission
            await db.flush()

        # stranger has no permission rows at all
        result = await ssvc.search_documents(db, stranger_id, "Private")

    check("SECURITY: stranger with no permissions sees 0 documents", result.total == 0)
    check("SECURITY: items list is empty for stranger", len(result.items) == 0)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("\n=== SEARCH SERVICE STANDALONE TEST SUITE ===")
    print("=== in-memory SQLite, no full app boot required ===")
    await init_db()

    await test_permission_security()
    await test_partial_match()
    await test_workspace_filter()
    await test_date_filter()
    await test_pagination()
    await test_folder_search()
    await test_user_search()
    await test_search_all()
    await test_no_permission_user()

    passed = sum(1 for s, _ in _results if s == PASS)
    failed = sum(1 for s, _ in _results if s == FAIL)
    total  = len(_results)

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
