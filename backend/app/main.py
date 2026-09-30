"""FreeOSINT-UI backend: only the work the browser cannot do (CORS-blocked lookups)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.http import create_client
from app.routers import telegram, username
from app.routers import url as url_router
from app.routers import footprint
from app.routers import reputation


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = create_client()
    try:
        yield
    finally:
        await app.state.http.aclose()


app = FastAPI(title="FreeOSINT-UI backend", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(username.router)
app.include_router(telegram.router)
app.include_router(url_router.router)
app.include_router(footprint.router)
app.include_router(reputation.router)
