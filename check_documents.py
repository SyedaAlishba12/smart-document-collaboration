import asyncio

from sqlalchemy import select

from database.session import AsyncSessionLocal
from models.document import Document
from models.user import User
from models.workspace_member import WorkspaceMember


async def main():
    async with AsyncSessionLocal() as db:

        print("\n========== USERS ==========")

        users_result = await db.execute(
            select(User).order_by(User.created_at)
        )

        users = users_result.scalars().all()

        for user in users:
            print(
                f"ID: {user.id} | "
                f"Name: {user.full_name} | "
                f"Email: {user.email}"
            )

        print("\n========== DOCUMENTS ==========")

        documents_result = await db.execute(
            select(Document).order_by(Document.created_at)
        )

        documents = documents_result.scalars().all()

        for document in documents:
            print(
                f"ID: {document.id} | "
                f"Title: {document.title} | "
                f"Owner: {document.owner_id} | "
                f"Workspace: {document.workspace_id} | "
                f"Created: {document.created_at}"
            )

        print("\n========== WORKSPACE MEMBERS ==========")

        members_result = await db.execute(
            select(WorkspaceMember)
        )

        members = members_result.scalars().all()

        for member in members:
            print(
                f"Workspace: {member.workspace_id} | "
                f"User: {member.user_id} | "
                f"Role: {member.role}"
            )


if __name__ == "__main__":
    asyncio.run(main())