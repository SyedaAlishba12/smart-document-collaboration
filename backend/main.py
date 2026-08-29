import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import your module routers (Zainab's owned modules included)
from routes.folder_routes import router as folder_router
from routes.document_routes import router as document_router
from routes.team_routes import router as team_router
from routes.file_routes import router as file_router

# Other team members' routers
from routes.comment_routes import router as comment_router
from routes.version_routes import router as version_router
from routes.collaboration_routes import router as collaboration_router
from routes.activity_log_routes import router as activity_log_router
from routes import auth_routes, user_routes, workspace_routes

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

# Registering Zainab's routers
app.include_router(folder_router)
app.include_router(document_router)  
app.include_router(team_router)
app.include_router(file_router)

# Registering Fatima's & other routers
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(workspace_routes.router)

# Registering Sayeel's & Syeda's routers
app.include_router(comment_router)
app.include_router(version_router)
app.include_router(collaboration_router)
app.include_router(activity_log_router)

@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Smart Document Collaboration Platform API",
        "data": None,
    }