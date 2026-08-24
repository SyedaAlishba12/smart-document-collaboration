from fastapi import FastAPI
from sqlalchemy import text

from database.session import AsyncSessionLocal
from routes.permission_routes import router as permission_router
from routes.notification_routes import router as notification_router
from routes.search_routes import router as search_router

app = FastAPI(
    title="Smart Document Collaboration API",
    description="Collaboration platform API — permissions, notifications, search.",
    version="0.1.0",
)

app.include_router(permission_router)
app.include_router(notification_router)
app.include_router(search_router)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Smart Document Collaboration API is running",
        "data": None,
    }


@app.get("/api/health/database")
async def database_health():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))

        return {
            "success": True,
            "message": "Database connection successful",
            "data": result.scalar(),
        }