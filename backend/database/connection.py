import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

engine = create_async_engine(
    DATABASE_URL,
    connect_args={
        "ssl": True
    },
    echo=True,
    # Neon (serverless Postgres) closes idle connections after a short
    # period. Without these, SQLAlchemy tries to reuse a dead connection
    # and crashes with "connection is closed" whenever the app has sat
    # idle for a few minutes (e.g. between testing sessions).
    pool_pre_ping=True,   # check the connection is alive before using it
    pool_recycle=280,     # proactively recycle connections before Neon's own timeout
)
