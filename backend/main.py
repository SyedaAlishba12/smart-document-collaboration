from fastapi import FastAPI
from sqlalchemy import text

from database.session import AsyncSessionLocal
from routes.comments import router as comments_router
from routes.comment_replies import router as comment_replies_router
from routes.document_versions import router as document_versions_router
from websocket.collaboration import router as websocket_router


app = FastAPI()

app.include_router(websocket_router)
app.include_router(comments_router)
app.include_router(comment_replies_router)
app.include_router(document_versions_router)
