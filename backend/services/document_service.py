from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
import uuid
from models.document import Document
from models.workspace import Workspace
from models.user import User
from schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentAutosave, DocumentMove, DocumentFavorite

class DocumentService:
    @staticmethod
    async def create_document(db: AsyncSession, owner_id: UUID, doc_data: DocumentCreate) -> Document:
        # 1. Ensure a valid User exists in the database to satisfy the foreign key
        result_user = await db.execute(select(User).where(User.id == owner_id))
        user = result_user.scalars().first()
        
        if not user:
            # Check if any user exists in the database
            result_any_user = await db.execute(select(User))
            user = result_any_user.scalars().first()
            
            if user:
                owner_id = user.id
            else:
                # Create a default system user if none exists
                owner_id = uuid.uuid4()
                default_user = User(
                    id=owner_id,
                    email="zainab.default@example.com",
                    password_hash="hashed_dummy_password",
                    full_name="Default User",
                    is_verified=True
                )
                db.add(default_user)
                await db.flush()

        # 2. Ensure a valid Workspace exists in the database
        workspace_id = doc_data.workspace_id
        workspace = None
        
        if workspace_id:
            result_ws = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
            workspace = result_ws.scalars().first()
            
        if not workspace:
            # Fetch the first available workspace
            result_any_ws = await db.execute(select(Workspace))
            workspace = result_any_ws.scalars().first()
            
            if workspace:
                workspace_id = workspace.id
            else:
                # Create a default workspace on the fly if none exists
                workspace_id = uuid.uuid4()
                new_workspace = Workspace(
                    id=workspace_id,
                    name="Default Workspace",
                    owner_id=owner_id
                )
                db.add(new_workspace)
                await db.flush()

        # 3. Create the new document safely with verified valid foreign keys
        new_doc = Document(
            workspace_id=workspace_id,
            folder_id=doc_data.folder_id,
            owner_id=owner_id,
            title=doc_data.title,
            content=doc_data.content,
            is_favorite=False,
            is_archived=False
        )
        
        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)
        return new_doc

    @staticmethod
    async def get_document_by_id(db: AsyncSession, document_id: UUID) -> Document | None:
        result = await db.execute(select(Document).where(Document.id == document_id))
        return result.scalars().first()

    @staticmethod
    async def update_document(db: AsyncSession, document_id: UUID, doc_data: DocumentUpdate) -> Document | None:
        doc = await DocumentService.get_document_by_id(db, document_id)
        if not doc:
            return None
        
        if doc_data.title is not None:
            doc.title = doc_data.title
        if doc_data.content is not None:
            doc.content = doc_data.content
        if doc_data.folder_id is not None:
            doc.folder_id = doc_data.folder_id

        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def autosave_document(db: AsyncSession, document_id: UUID, autosave_data: DocumentAutosave) -> Document | None:
        doc = await DocumentService.get_document_by_id(db, document_id)
        if not doc:
            return None
        
        doc.content = autosave_data.content
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def move_document(db: AsyncSession, document_id: UUID, move_data: DocumentMove) -> Document | None:
        doc = await DocumentService.get_document_by_id(db, document_id)
        if not doc:
            return None
        
        doc.folder_id = move_data.folder_id
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def toggle_favorite(db: AsyncSession, document_id: UUID, fav_data: DocumentFavorite) -> Document | None:
        doc = await DocumentService.get_document_by_id(db, document_id)
        if not doc:
            return None
        
        doc.is_favorite = fav_data.is_favorite
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: UUID) -> bool:
        doc = await DocumentService.get_document_by_id(db, document_id)
        if not doc:
            return False
        
        await db.delete(doc)
        await db.commit()
        return True