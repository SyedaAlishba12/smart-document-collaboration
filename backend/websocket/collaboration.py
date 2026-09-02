from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import AsyncSessionLocal
from websocket.connection_manager import manager
from services.collaboration_service import CollaborationService
from services.permission_service import can_edit
from common.security import decode_token

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/documents/{document_id}")
async def document_collaboration(
    websocket: WebSocket,
    document_id: UUID,
    token: str = Query(...),
):
    # 1. Authenticate via JWT token
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008)  # Policy violation
        return
    user_id = UUID(payload["sub"])

    # 2. Permission check (only editors/owners can edit, viewers can view? we use can_edit for now)
    async with AsyncSessionLocal() as db:
        allowed = await can_edit(db, user_id, "document", document_id)
    if not allowed:
        await websocket.close(code=1003)  # Forbidden
        return

    # 3. Connect to the collaboration room
    await manager.connect(document_id, user_id, websocket)

    try:
        # Send join confirmation to the connecting user
        await manager.send_personal(
            document_id,
            user_id,
            {
                "event": "document:join",
                "data": {
                    "document_id": str(document_id),
                    "user_id": str(user_id),
                    "active_users": [
                        str(u) for u in manager.get_document_users(document_id)
                    ],
                },
            },
        )

        # Notify others that a user joined
        await manager.broadcast(
            document_id,
            {
                "event": "document:presence",
                "data": {
                    "user_id": str(user_id),
                    "status": "online",
                },
            },
            exclude_user_id=user_id,
        )

        # Listen for messages
        while True:
            message = await websocket.receive_json()
            event = message.get("event")
            data = message.get("data", {})

            if event == "document:leave":
                break
            elif event in {
                "document:update",
                "document:cursor",
                "document:presence",
                "document:save",
            }:
                await CollaborationService.broadcast_event(
                    document_id, user_id, event, data
                )

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(document_id, user_id)
        await manager.broadcast(
            document_id,
            {
                "event": "document:presence",
                "data": {
                    "user_id": str(user_id),
                    "status": "offline",
                },
            },
        )