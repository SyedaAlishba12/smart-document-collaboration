import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text

from database.session import AsyncSessionLocal
from models import (
    user,
    workspace,
    workspace_member,
    document,
    folder,
    team,
    file as file_model,
)

# Zainab's routers
from routes.folder_routes import router as folder_router
from routes.document_routes import router as document_router
from routes.team_routes import router as team_router
from routes.file_routes import router as file_router

# Taha / Sayeel routers
from routes.permission_routes import router as permission_router
from routes.notification_routes import router as notification_router
from routes.search_routes import router as search_router
from routes.comment_routes import router as comment_router
from routes.version_routes import router as version_router
from routes.collaboration_routes import router as collaboration_router
from routes.activity_log_routes import router as activity_log_router

# Fatima's routers
from routes import auth_routes, user_routes, workspace_routes

load_dotenv()


app = FastAPI(
    title="Smart Document Collaboration API",
    description="Collaboration platform API — permissions, notifications, search.",
    version="0.1.0",
)


frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Taha / Sayeel routers
# ---------------------------------------------------------

app.include_router(permission_router)
app.include_router(notification_router)
app.include_router(search_router)
app.include_router(comment_router)
app.include_router(version_router)
app.include_router(collaboration_router)
app.include_router(activity_log_router)


# ---------------------------------------------------------
# Zainab's routers
# ---------------------------------------------------------

app.include_router(folder_router)
app.include_router(document_router)
app.include_router(team_router)
app.include_router(file_router)


# ---------------------------------------------------------
# Fatima's routers
# ---------------------------------------------------------

app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(workspace_routes.router)


# ---------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Smart Document Collaboration Platform API",
        "data": None,
    }


# ---------------------------------------------------------
# Database health endpoint
# ---------------------------------------------------------

@app.get("/api/health/database")
async def database_health():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1"))

        return {
            "success": True,
            "message": "Database connection successful",
            "data": result.scalar(),
        }