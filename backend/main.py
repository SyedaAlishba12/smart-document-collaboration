from fastapi import FastAPI

# Import your module routers
from routes.comment_routes import router as comment_router
from routes.version_routes import router as version_router
from routes.collaboration_routes import router as collaboration_router
from routes.auth_routes import router as auth_router 
from routes.document_routes import router as document_router

# Temporarily commented until Fatima provides auth routes
# from routes.auth_routes import router as auth_router

app = FastAPI()

# app.include_router(auth_router)
app.include_router(auth_router)
app.include_router(comment_router)
app.include_router(version_router)
app.include_router(collaboration_router)
app.include_router(document_router) 


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Smart Document Collaboration Platform API",
        "data": None,
    }