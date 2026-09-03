from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from services.document_service import DocumentService
from services.document_version_service import DocumentVersionService

from schemas.document_schema import (
    DocumentCreate,
    DocumentUpdate,
    DocumentAutosave,
    DocumentMove,
    DocumentFavorite,
)

from models.document import Document
from models.permission import Permission


class DocumentController:

    @staticmethod
    async def get_documents_by_workspace(
        db: AsyncSession,
        workspace_id: UUID,
        user_id: UUID,
    ):
        try:
            query = (
                select(Document)
                .join(
                    Permission,
                    Permission.document_id == Document.id,
                )
                .where(
                    Document.workspace_id == workspace_id,
                    Permission.user_id == user_id,
                )
            )

            result = await db.execute(query)
            documents = result.scalars().all()

            return {
                "success": True,
                "message": "Documents fetched successfully by workspace",
                "data": documents,
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "data": [],
            }

    @staticmethod
    async def get_all_documents(
        db: AsyncSession,
        user_id: UUID,
    ):
        try:
            query = (
                select(Document)
                .join(
                    Permission,
                    Permission.document_id == Document.id,
                )
                .where(
                    Permission.user_id == user_id,
                )
            )

            result = await db.execute(query)
            documents = result.scalars().all()

            return {
                "success": True,
                "message": "Documents fetched successfully",
                "data": documents,
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "data": [],
            }

    @staticmethod
    async def create_document(
        db: AsyncSession,
        owner_id: UUID,
        doc_data: DocumentCreate,
    ):
        try:
            doc = await DocumentService.create_document(
                db,
                owner_id,
                doc_data,
            )

            if not doc:
                return {
                    "success": False,
                    "message": "Failed to create document in database",
                    "data": None,
                }

            return {
                "success": True,
                "message": "Document created successfully",
                "data": doc,
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "data": None,
            }

    @staticmethod
    async def get_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ):
        doc = await DocumentService.get_document_by_id(
            db,
            document_id,
            user_id,
        )

        if not doc:
            return {
                "success": False,
                "message": "Document not found or access denied",
                "data": None,
            }

        return {
            "success": True,
            "message": "Document fetched successfully",
            "data": doc,
        }

    @staticmethod
    async def update_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        doc_data: DocumentUpdate,
    ):
        doc = await DocumentService.update_document(
            db,
            document_id,
            user_id,
            doc_data,
        )

        if not doc:
            return {
                "success": False,
                "message": "Document not found",
                "data": None,
            }

        return {
            "success": True,
            "message": "Document updated successfully",
            "data": doc,
        }

    @staticmethod
    async def autosave_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        autosave_data: DocumentAutosave,
    ):
        try:
            result = await DocumentService.autosave_document(
                db,
                document_id,
                user_id,
                autosave_data,
            )

            if not result or not result.get("success"):
                return {
                    "success": False,
                    "message": (
                        result.get(
                            "message",
                            "Document autosave failed",
                        )
                        if result
                        else "Document autosave failed"
                    ),
                    "data": None,
                }

            doc = result.get("data")

            if not doc:
                return {
                    "success": False,
                    "message": "Autosave succeeded but document data is missing",
                    "data": None,
                }

            await DocumentVersionService.create_version(
                session=db,
                document_id=document_id,
                created_by=user_id,
                content=doc.content or "",
            )

            return {
                "success": True,
                "message": "Document autosaved and version created successfully",
                "data": doc,
            }

        except Exception as e:
            await db.rollback()

            return {
                "success": False,
                "message": str(e),
                "data": None,
            }

    @staticmethod
    async def move_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        move_data: DocumentMove,
    ):
        doc = await DocumentService.move_document(
            db,
            document_id,
            user_id,
            move_data,
        )

        if not doc:
            return {
                "success": False,
                "message": "Document not found",
                "data": None,
            }

        return {
            "success": True,
            "message": "Document moved successfully",
            "data": doc,
        }

    @staticmethod
    async def toggle_favorite(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        fav_data: DocumentFavorite,
    ):
        doc = await DocumentService.toggle_favorite(
            db,
            document_id,
            user_id,
            fav_data,
        )

        if not doc:
            return {
                "success": False,
                "message": "Document not found",
                "data": None,
            }

        return {
            "success": True,
            "message": "Document favorite status updated",
            "data": doc,
        }

    @staticmethod
    async def delete_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ):
        success = await DocumentService.delete_document(
            db,
            document_id,
            user_id,
        )

        if not success:
            return {
                "success": False,
                "message": "Document not found",
                "data": None,
            }

        return {
            "success": True,
            "message": "Document deleted successfully",
            "data": None,
        }