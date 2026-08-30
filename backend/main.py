from fastapi import FastAPI

<<<<<<< HEAD
from database.session import AsyncSessionLocal
from routes.permission_routes import router as permission_router
from routes.notification_routes import router as notification_router
from routes.search_routes import router as search_router
=======
# Import your module routers
from routes.comment_routes import router as comment_router
from routes.version_routes import router as version_router
from routes.collaboration_routes import router as collaboration_router

# Temporarily commented until Fatima provides auth routes
# from routes.auth_routes import router as auth_router
>>>>>>> origin/develop

app = FastAPI(
    title="Smart Document Collaboration API",
    description="Collaboration platform API — permissions, notifications, search.",
    version="0.1.0",
)

app.include_router(permission_router)
app.include_router(notification_router)
app.include_router(search_router)

# app.include_router(auth_router)
app.include_router(comment_router)
app.include_router(version_router)
app.include_router(collaboration_router)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Smart Document Collaboration Platform API",
        "data": None,
    }