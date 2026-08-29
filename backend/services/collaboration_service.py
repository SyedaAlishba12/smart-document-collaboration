from uuid import UUID

from websocket.connection_manager import manager


class CollaborationService:

    @staticmethod
    async def join(
        document_id: UUID,
        user_id: UUID,
        websocket,
    ):
        await manager.connect(document_id, user_id, websocket)
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

    @staticmethod
    async def leave(
        document_id: UUID,
        user_id: UUID,
    ):
        await manager.disconnect(document_id, user_id)

    @staticmethod
    async def broadcast_event(
        document_id: UUID,
        user_id: UUID,
        event: str,
        data: dict,
    ):
        await manager.broadcast(
            document_id,
            {
                "event": event,
                "data": {
                    **data,
                    "user_id": str(user_id),
                },
            },
            exclude_user_id=user_id,
        )