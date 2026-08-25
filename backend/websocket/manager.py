from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections grouped by document.

    Each document acts as a collaboration room.
    """

    def __init__(self) -> None:
        self.active_connections: dict[UUID, dict[UUID, WebSocket]] = defaultdict(dict)

    async def connect(
        self,
        document_id: UUID,
        user_id: UUID,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept()

        self.active_connections[document_id][user_id] = websocket

    def disconnect(
        self,
        document_id: UUID,
        user_id: UUID,
    ) -> None:
        document_connections = self.active_connections.get(document_id)

        if not document_connections:
            return

        document_connections.pop(user_id, None)

        if not document_connections:
            self.active_connections.pop(document_id, None)

    def is_connected(
        self,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:
        return user_id in self.active_connections.get(document_id, {})

    def get_document_users(
        self,
        document_id: UUID,
    ) -> list[UUID]:
        return list(
            self.active_connections.get(document_id, {}).keys()
        )

    async def send_personal(
        self,
        document_id: UUID,
        user_id: UUID,
        message: dict[str, Any],
    ) -> None:
        websocket = self.active_connections.get(
            document_id,
            {},
        ).get(user_id)

        if websocket is None:
            return

        await websocket.send_json(message)

    async def broadcast(
        self,
        document_id: UUID,
        message: dict[str, Any],
        exclude_user_id: UUID | None = None,
    ) -> None:
        connections = self.active_connections.get(
            document_id,
            {},
        )

        disconnected_users: list[UUID] = []

        for user_id, websocket in connections.items():
            if exclude_user_id is not None and user_id == exclude_user_id:
                continue

            try:
                await websocket.send_json(message)
            except Exception:
                disconnected_users.append(user_id)

        for user_id in disconnected_users:
            self.disconnect(document_id, user_id)