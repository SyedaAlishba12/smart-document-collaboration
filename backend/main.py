from fastapi import FastAPI
from sqlalchemy import text

from database.session import AsyncSessionLocal

app = FastAPI()


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