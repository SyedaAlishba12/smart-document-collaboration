import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from dotenv import load_dotenv

from database.session import AsyncSessionLocal
from routes.folder_routes import router as folder_router
from routes.document_routes import router as document_router
from routes.team_routes import router as team_router
from routes.file_routes import router as file_router

load_dotenv()

app = FastAPI(title="Smart Document Collaboration API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(folder_router)
app.include_router(document_router)  
app.include_router(team_router)
app.include_router(file_router)

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