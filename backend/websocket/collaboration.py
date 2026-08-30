from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket.connection_manager import manager
from services.collaboration_service import CollaborationService

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/documents/{document_id}")
async def document_collaboration(
    websocket: WebSocket,
    document_id: UUID,
):
    # ⚠️ TEMP: Replace with proper JWT auth via query param or header
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        await websocket.close(code=1008)
        return
    user_id = UUID(user_id)

    # ⚠️ PERMISSION CHECK (commented until Taha implements)
    # from services.permission_service import can_edit
    # if not await can_edit(db, user_id, "document", document_id):
    #     await websocket.close(code=1003)
    #     return

    await manager.connect(document_id, user_id, websocket)

    try:
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