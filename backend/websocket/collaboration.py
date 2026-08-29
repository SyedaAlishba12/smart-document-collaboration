from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from websocket.connection_manager import manager
from services.collaboration_service import CollaborationService

from common.security import decode_token

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/documents/{document_id}")
async def document_collaboration(
    websocket: WebSocket,
    document_id: UUID,
    token: str = Query(...),
):
    # 1. Authenticate User
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008)  # Policy Violation
        return
    user_id = UUID(payload["sub"])

    # 2. Permission Check (Taha's stub - safely handled)
    try:
        from services.permission_service import can_edit
        # Uncomment once Taha implements:
        # if not await can_edit(db, user_id, "document", document_id):
        #     await websocket.close(code=1003)
        #     return
    except (NotImplementedError, ImportError):
        pass

    # 3. Connect to Room
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
                    "active_users": [str(u) for u in manager.get_document_users(document_id)],
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
            elif event in {"document:update", "document:cursor", "document:presence", "document:save"}:
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