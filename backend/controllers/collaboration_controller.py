from uuid import UUID


async def handle_event(
    document_id: UUID,
    user_id: UUID,
    event: str,
    data: dict,
):
    from services.collaboration_service import CollaborationService

    if event in {
        "document:update",
        "document:cursor",
        "document:presence",
        "document:save",
    }:
        await CollaborationService.broadcast_event(
            document_id, user_id, event, data
        )