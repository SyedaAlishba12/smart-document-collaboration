"""
conftest.py — shared fixtures for the permissions/search/notifications test suite.

Fixtures provided
-----------------
client
    Starlette TestClient wrapping main.app.

    Two things are overridden at fixture setup so tests never touch a real DB
    or need a running uvicorn:

    1.  get_db dependency → replaced with a no-op async generator that yields
        a MagicMock.  Tests that exercise controller/service behaviour mock the
        service functions directly anyway, but the dependency must resolve or
        FastAPI raises a 500 before the route runs.

    2.  get_current_user_id dependency → replaced with a fixed UUID so auth
        doesn't gate any route.

Notes
-----
- TestClient is *synchronous* even though the routes are async — starlette's
  TestClient runs the ASGI app in a thread with its own event loop.  No
  pytest-asyncio marks are needed for route / controller tests.
- Schema validation tests are pure Pydantic — no fixtures needed there.
- pytest-asyncio is declared as a dependency but not used in this initial test
  suite; it is included because service-logic tests (once implemented) will
  need it for async DB calls.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Import the app and the two dependencies we will override
# ---------------------------------------------------------------------------

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from middleware.permission_middleware import get_current_user_id, get_db

# Sentinel used in middleware stub — matches the value hardcoded in
# permission_middleware.get_current_user_id()
SENTINEL_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def _fake_db():
    """Dependency override: yields a MagicMock so no real DB session is opened."""
    yield MagicMock()


async def _fake_user_id():
    """Dependency override: returns the same sentinel UUID the stub uses."""
    return SENTINEL_USER_ID


@pytest.fixture(scope="module")
def client():
    """
    Module-scoped TestClient with DB and auth dependencies overridden.

    scope="module" so the app startup/shutdown lifecycle runs once per file,
    not once per test.
    """
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_current_user_id] = _fake_user_id

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    app.dependency_overrides.clear()
