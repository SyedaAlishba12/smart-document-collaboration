from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from models.document import Document
from models.workspace import Workspace
from models.user import User
from models.activity_log import ActivityLog
from models.permission import Permission, PermissionLevel, SharingScope

from schemas.document_schema import (
    DocumentCreate,
    DocumentUpdate,
    DocumentAutosave,
    DocumentMove,
    DocumentFavorite,
)


class DocumentService:

    # ---------------------------------------------------------
    # Permission helpers
    # ---------------------------------------------------------

    @staticmethod
    async def get_user_permission(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Permission | None:
        """
        Get the authenticated user's permission for a document.
        """

        result = await db.execute(
            select(Permission).where(
                Permission.document_id == document_id,
                Permission.user_id == user_id,
            )
        )

        return result.scalars().first()

    @staticmethod
    async def can_view_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        Check whether a user has any explicit permission
        to view a document.
        """

        permission = await DocumentService.get_user_permission(
            db,
            document_id,
            user_id,
        )

        return permission is not None

    @staticmethod
    async def can_edit_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        Only owners and editors can modify document content.
        """

        permission = await DocumentService.get_user_permission(
            db,
            document_id,
            user_id,
        )

        if not permission:
            return False

        return permission.permission_level in {
            PermissionLevel.owner,
            PermissionLevel.editor,
        }

    @staticmethod
    async def is_document_owner(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:
        """
        Check whether the authenticated user owns the document.
        """

        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.owner_id == user_id,
            )
        )

        return result.scalars().first() is not None

    # ---------------------------------------------------------
    # Create document
    # ---------------------------------------------------------

    @staticmethod
    async def create_document(
        db: AsyncSession,
        owner_id: UUID,
        doc_data: DocumentCreate,
    ) -> Document:

        result_user = await db.execute(
            select(User).where(User.id == owner_id)
        )

        user = result_user.scalars().first()

        if not user:
            raise ValueError(
                "Authenticated user does not exist."
            )

        workspace_id = doc_data.workspace_id

        if not workspace_id:
            raise ValueError(
                "Workspace ID is required."
            )

        result_ws = await db.execute(
            select(Workspace).where(
                Workspace.id == workspace_id
            )
        )

        workspace = result_ws.scalars().first()

        if not workspace:
            raise ValueError(
                "Workspace does not exist."
            )

        new_doc = Document(
            workspace_id=workspace_id,
            folder_id=doc_data.folder_id,
            owner_id=owner_id,
            title=doc_data.title,
            content=doc_data.content,
            is_favorite=False,
            is_archived=False,
        )

        db.add(new_doc)

        await db.flush()

        new_perm = Permission(
            document_id=new_doc.id,
            user_id=owner_id,
            permission_level=PermissionLevel.owner,
            granted_by=owner_id,
            sharing_scope=SharingScope.private,
        )

        db.add(new_perm)

        await db.commit()
        await db.refresh(new_doc)

        return new_doc

    # ---------------------------------------------------------
    # Get single document
    # ---------------------------------------------------------

    @staticmethod
    async def get_document_by_id(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Document | None:

        result = await db.execute(
            select(Document)
            .join(
                Permission,
                Permission.document_id == Document.id,
            )
            .where(
                Document.id == document_id,
                Permission.user_id == user_id,
            )
        )

        return result.scalars().first()

    # ---------------------------------------------------------
    # Update document
    # ---------------------------------------------------------

    @staticmethod
    async def update_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        doc_data: DocumentUpdate,
    ) -> Document | None:

        can_edit = await DocumentService.can_edit_document(
            db,
            document_id,
            user_id,
        )

        if not can_edit:
            raise PermissionError(
                "You do not have permission to edit this document."
            )

        result = await db.execute(
            select(Document).where(
                Document.id == document_id
            )
        )

        doc = result.scalars().first()

        if not doc:
            return None

        if doc_data.title is not None:
            doc.title = doc_data.title

        if doc_data.content is not None:
            doc.content = doc_data.content

        if doc_data.folder_id is not None:
            doc.folder_id = doc_data.folder_id

        if doc_data.is_favorite is not None:
            doc.is_favorite = doc_data.is_favorite

        if doc_data.is_archived is not None:
            doc.is_archived = doc_data.is_archived

        await db.commit()
        await db.refresh(doc)

        return doc

    # ---------------------------------------------------------
    # Autosave
    # ---------------------------------------------------------

    @staticmethod
    async def autosave_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        autosave_data: DocumentAutosave,
    ) -> dict:

        can_edit = await DocumentService.can_edit_document(
            db,
            document_id,
            user_id,
        )

        if not can_edit:
            raise PermissionError(
                "You do not have permission to edit this document."
            )

        result = await db.execute(
            select(Document).where(
                Document.id == document_id
            )
        )

        doc = result.scalars().first()

        if not doc:
            return {
                "success": False,
                "message": "Document not found",
            }

        if autosave_data.title is not None:
            doc.title = autosave_data.title

        if autosave_data.content is not None:
            doc.content = autosave_data.content

        await db.commit()
        await db.refresh(doc)

        return {
            "success": True,
            "data": doc,
        }

    # ---------------------------------------------------------
    # Move document
    # ---------------------------------------------------------

    @staticmethod
    async def move_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        move_data: DocumentMove,
    ) -> Document | None:

        is_owner = await DocumentService.is_document_owner(
            db,
            document_id,
            user_id,
        )

        if not is_owner:
            raise PermissionError(
                "Only the document owner can move this document."
            )

        result = await db.execute(
            select(Document).where(
                Document.id == document_id
            )
        )

        doc = result.scalars().first()

        if not doc:
            return None

        doc.folder_id = move_data.folder_id

        await db.commit()
        await db.refresh(doc)

        return doc

    # ---------------------------------------------------------
    # Favorite
    # ---------------------------------------------------------

    @staticmethod
    async def toggle_favorite(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        fav_data: DocumentFavorite,
    ) -> Document | None:

        is_owner = await DocumentService.is_document_owner(
            db,
            document_id,
            user_id,
        )

        if not is_owner:
            raise PermissionError(
                "Only the document owner can change this favorite status."
            )

        result = await db.execute(
            select(Document).where(
                Document.id == document_id
            )
        )

        doc = result.scalars().first()

        if not doc:
            return None

        doc.is_favorite = fav_data.is_favorite

        await db.commit()
        await db.refresh(doc)

        return doc

    # ---------------------------------------------------------
    # Delete
    # ---------------------------------------------------------

    @staticmethod
    async def delete_document(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> bool:

        is_owner = await DocumentService.is_document_owner(
            db,
            document_id,
            user_id,
        )

        if not is_owner:
            raise PermissionError(
                "Only the document owner can delete this document."
            )

        try:
            doc = await DocumentService.get_document_by_id(
                db,
                document_id,
                user_id,
            )

            if not doc:
                return False

            await db.execute(
                Permission.__table__.delete().where(
                    Permission.document_id == document_id
                )
            )

            await db.execute(
                ActivityLog.__table__.update()
                .where(
                    ActivityLog.document_id == document_id
                )
                .values(
                    document_id=None
                )
            )

            await db.delete(doc)

            await db.commit()

            return True

        except Exception:
            await db.rollback()
            raise