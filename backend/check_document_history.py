import asyncio

from sqlalchemy import select

from database.session import AsyncSessionLocal
from models.activity_log import ActivityLog
from models.permission import Permission
from models.document import Document
from models.user import User


async def main():
    async with AsyncSessionLocal() as db:

        print("\n========== DOCUMENT ACTIVITY ==========")

        activity_result = await db.execute(
            select(ActivityLog)
            .order_by(ActivityLog.created_at.asc())
        )

        activities = activity_result.scalars().all()

        for activity in activities:
            print(
                f"Document: {activity.document_id} | "
                f"User: {activity.user_id} | "
                f"Action: {activity.action} | "
                f"Description: {activity.description} | "
                f"Created: {activity.created_at}"
            )

        print("\n========== DOCUMENT PERMISSIONS ==========")

        permission_result = await db.execute(
            select(Permission)
            .order_by(Permission.created_at.asc())
        )

        permissions = permission_result.scalars().all()

        for permission in permissions:
            print(
                f"Document: {permission.document_id} | "
                f"User: {permission.user_id} | "
                f"Level: {permission.permission_level} | "
                f"Granted By: {permission.granted_by} | "
                f"Created: {permission.created_at}"
            )


if __name__ == "__main__":
    asyncio.run(main())