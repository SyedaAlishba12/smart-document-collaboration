from fastapi import FastAPI
from sqlalchemy import text

from database.session import AsyncSessionLocal
from models import user, workspace, workspace_member
from routes import auth_routes, user_routes, workspace_routes

app = FastAPI()

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(workspace_routes.router)


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