import asyncio
from pathlib import Path

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.database import SessionLocal, create_db_and_tables
from app.middleware.redis_response_cache import RedisResponseCacheMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.routers import analytics, categories, delivery_cases, health, home, inquiries, management_auth, management_catalog, management_files, management_inquiries, management_translations, news, operation_logs, products, rum, site_settings, solutions, speech, website_config
from app.services.admin_bootstrap import ensure_admin_user
from app.services.redis_cache import RedisCache


settings = get_settings()
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name)
redis_cache = RedisCache(
    url=settings.redis_url,
    default_ttl=settings.redis_cache_ttl_seconds,
    namespace=settings.redis_cache_namespace,
)

app.add_middleware(
    RedisResponseCacheMiddleware,
    cache=redis_cache,
    revalidate_url=settings.nuxt_revalidate_url,
    revalidate_urls=settings.nuxt_revalidate_urls,
    revalidate_secret=settings.nuxt_revalidate_secret,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIdMiddleware)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(site_settings.router, prefix=settings.api_prefix)
app.include_router(site_settings.management_router, prefix=settings.api_prefix)
app.include_router(categories.router, prefix=settings.api_prefix)
app.include_router(products.router, prefix=settings.api_prefix)
app.include_router(solutions.router, prefix=settings.api_prefix)
app.include_router(news.router, prefix=settings.api_prefix)
app.include_router(delivery_cases.router, prefix=settings.api_prefix)
app.include_router(inquiries.router, prefix=settings.api_prefix)
app.include_router(management_auth.router, prefix=settings.api_prefix)
app.include_router(management_catalog.router, prefix=settings.api_prefix)
app.include_router(management_inquiries.router, prefix=settings.api_prefix)
app.include_router(management_files.router, prefix=settings.api_prefix)
app.include_router(management_translations.router, prefix=settings.api_prefix)
app.include_router(operation_logs.router, prefix=settings.api_prefix)
app.include_router(analytics.router, prefix=settings.api_prefix)
app.include_router(analytics.management_router, prefix=settings.api_prefix)
app.include_router(rum.router, prefix=settings.api_prefix)
app.include_router(website_config.public_router, prefix=settings.api_prefix)
app.include_router(website_config.management_router, prefix=settings.api_prefix)
app.include_router(home.router, prefix=settings.api_prefix)
app.include_router(speech.router, prefix=settings.api_prefix)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

PUBLIC_CACHE_WARMUP_PATHS = (
    "/api/home",
    "/api/categories",
    "/api/site-settings",
    "/api/website-config",
)
cache_warmup_task: asyncio.Task[None] | None = None


async def warm_public_response_cache() -> None:
    await asyncio.sleep(0.5)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://cache-warmup", timeout=30.0) as client:
        await asyncio.gather(
            *(client.get(path) for path in PUBLIC_CACHE_WARMUP_PATHS),
            return_exceptions=True,
        )


@app.on_event("startup")
async def on_startup() -> None:
    global cache_warmup_task
    create_db_and_tables()
    with SessionLocal() as db:
        ensure_admin_user(db)
        db.commit()
    cache_warmup_task = asyncio.create_task(warm_public_response_cache())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    if cache_warmup_task is not None and not cache_warmup_task.done():
        cache_warmup_task.cancel()
    await redis_cache.close()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "API is running"}


@app.post("/api/internal/cache/invalidate")
async def invalidate_internal_cache(
    payload: dict[str, object] | None = None,
    x_revalidate_secret: str = Header(default=""),
) -> dict[str, object]:
    if not settings.nuxt_revalidate_secret or x_revalidate_secret != settings.nuxt_revalidate_secret:
        raise HTTPException(status_code=401, detail="Invalid revalidation secret")
    scopes = payload.get("scopes") if isinstance(payload, dict) else None
    requested = tuple(scope for scope in scopes if isinstance(scope, str)) if isinstance(scopes, list) else ()
    changed = await redis_cache.invalidate_public_cache(requested or PUBLIC_CACHE_WARMUP_PATHS)
    return {"status": "ok", "invalidated": changed}
