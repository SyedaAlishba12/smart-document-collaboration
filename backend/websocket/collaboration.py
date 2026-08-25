from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from websocket.manager import ConnectionManager


router = APIRouter(
    prefix="/ws",
    tags=["websocket"],
)

manager = ConnectionManager()


@router.websocket("/documents/{document_id}")
async def document_collaboration(
    websocket: WebSocket,
    document_id: UUID,
    user_id: UUID,
) -> None:
    await manager.connect(
        document_id=document_id,
        user_id=user_id,
        websocket=websocket,
    )

    try:
        await manager.broadcast(
            document_id=document_id,
            message={
                "event": "document:presence",
                "action": "joined",
                "user_id": str(user_id),
            },
            exclude_user_id=user_id,
        )

        await websocket.send_json(
            {
                "event": "document:join",
                "document_id": str(document_id),
                "user_id": str(user_id),
                "users": [
                    str(active_user_id)
                    for active_user_id in manager.get_document_users(
                        document_id
                    )
                ],
            }
        )

        while True:
            message = await websocket.receive_json()

            event = message.get("event")

            if event == "document:leave":
                break

            if event == "document:update":
                await manager.broadcast(
                    document_id=document_id,
                    message={
                        "event": "document:update",
                        "user_id": str(user_id),
                        "data": message.get("data"),
                    },
                    exclude_user_id=user_id,
                )

            elif event == "document:cursor":
                await manager.broadcast(
                    document_id=document_id,
                    message={
                        "event": "document:cursor",
                        "user_id": str(user_id),
                        "data": message.get("data"),
                    },
                    exclude_user_id=user_id,
                )

            elif event == "document:presence":
                await manager.broadcast(
                    document_id=document_id,
                    message={
                        "event": "document:presence",
                        "user_id": str(user_id),
                        "data": message.get("data"),
                    },
                    exclude_user_id=user_id,
                )

            elif event == "document:save":
                await manager.broadcast(
                    document_id=document_id,
                    message={
                        "event": "document:save",
                        "user_id": str(user_id),
                        "data": message.get("data"),
                    },
                    exclude_user_id=user_id,
                )

    except WebSocketDisconnect:
        pass

    finally:
        manager.disconnect(
            document_id=document_id,
            user_id=user_id,
        )

        await manager.broadcast(
            document_id=document_id,
            message={
                "event": "document:presence",
                "action": "left",
                "user_id": str(user_id),
            },
        )