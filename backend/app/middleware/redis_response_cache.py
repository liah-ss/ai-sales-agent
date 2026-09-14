from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.redis_cache import (
    RedisCache,
    is_public_cache_path,
    public_cache_prefixes_for_management_path,
    public_cache_ttl,
    response_cache_key,
)


logger = logging.getLogger(__name__)


class RedisResponseCacheMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        cache: RedisCache,
        revalidate_url: str = "",
        revalidate_urls: str = "",
        revalidate_secret: str = "",
    ) -> None:
        super().__init__(app)
        self.cache = cache
        configured_urls = [revalidate_url, *revalidate_urls.split(",")]
        self.revalidate_urls = tuple(dict.fromkeys(url.strip() for url in configured_urls if url.strip()))
        self.revalidate_secret = revalidate_secret
        self._key_locks: dict[str, asyncio.Lock] = {}
        self._key_lock_users: dict[str, int] = {}
        self._key_locks_guard = asyncio.Lock()
        self._refresh_tasks: set[asyncio.Task] = set()
        self._refresh_keys: set[str] = set()
        self._refresh_guard = asyncio.Lock()
        self._active_refreshes = 0
        self._max_stale_refreshes = 1

    async def schedule_stale_refresh(self, path: str, query: str, key: str, ttl: int) -> None:
        async with self._refresh_guard:
            if key in self._refresh_keys or self._active_refreshes >= self._max_stale_refreshes:
                return
            self._refresh_keys.add(key)
            self._active_refreshes += 1

        task = asyncio.create_task(self._run_scheduled_refresh(path, query, key, ttl))
        self._refresh_tasks.add(task)
        task.add_done_callback(self._refresh_tasks.discard)

    async def _run_scheduled_refresh(self, path: str, query: str, key: str, ttl: int) -> None:
        try:
            await self.refresh_stale(path, query, key, ttl)
        finally:
            async with self._refresh_guard:
                self._refresh_keys.discard(key)
                self._active_refreshes -= 1

    @asynccontextmanager
    async def coalesce_cache_miss(self, key: str):
        async with self._key_locks_guard:
            lock = self._key_locks.setdefault(key, asyncio.Lock())
            self._key_lock_users[key] = self._key_lock_users.get(key, 0) + 1
        try:
            async with lock:
                yield
        finally:
            async with self._key_locks_guard:
                remaining = self._key_lock_users[key] - 1
                if remaining == 0:
                    self._key_lock_users.pop(key, None)
                    self._key_locks.pop(key, None)
                else:
                    self._key_lock_users[key] = remaining

    async def revalidate_public_pages(self, scopes: tuple[str, ...]) -> None:
        if not self.revalidate_urls or not self.revalidate_secret:
            return
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                results = await asyncio.gather(
                    *(client.post(
                        url,
                        headers={"X-Revalidate-Secret": self.revalidate_secret},
                        json={"scopes": list(scopes)},
                    ) for url in self.revalidate_urls),
                    return_exceptions=True,
                )
                failures = [
                    result for result in results
                    if isinstance(result, Exception)
                    or (isinstance(getattr(result, "status_code", None), int) and result.status_code >= 400)
                ]
                if failures:
                    logger.warning("Public cache revalidation failed for %d/%d targets", len(failures), len(results))
        except httpx.HTTPError as exc:
            logger.warning("Public cache revalidation failed: %s", exc)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        is_internal_refresh = request.headers.get("X-Cache-Refresh") == "1"
        if request.method == "GET" and is_public_cache_path(path) and not is_internal_refresh:
            response_key_factory = getattr(self.cache, "response_key", None)
            key = (
                await response_key_factory(path, request.url.query)
                if response_key_factory is not None
                else response_cache_key(self.cache.namespace, path, request.url.query)
            )
            ttl = public_cache_ttl(path, self.cache.default_ttl)
            browser_ttl = min(60, ttl)
            cache_control = f"public, max-age={browser_ttl}, stale-while-revalidate={min(300, ttl)}"
            cached_entry = await self.cache.get_entry(key)
            if cached_entry is not None:
                cached, is_stale = cached_entry
                if is_stale:
                    await self.schedule_stale_refresh(path, request.url.query, key, ttl)
                return Response(
                    content=cached,
                    status_code=200,
                    media_type="application/json",
                    headers={"X-Redis-Cache": "STALE" if is_stale else "HIT", "Cache-Control": cache_control},
                )

            async with self.coalesce_cache_miss(key):
                cached = await self.cache.get(key)
                if cached is not None:
                    return Response(
                        content=cached,
                        status_code=200,
                        media_type="application/json",
                        headers={"X-Redis-Cache": "HIT", "Cache-Control": cache_control},
                    )

                acquire_lock = getattr(self.cache, "acquire_fill_lock", None)
                release_lock = getattr(self.cache, "release_fill_lock", None)
                wait_for_fill = getattr(self.cache, "wait_for_fill", None)
                lock_token = await acquire_lock(key) if acquire_lock is not None else "local-only"
                if lock_token is None and wait_for_fill is not None:
                    cached = await wait_for_fill(key)
                    if cached is not None:
                        return Response(
                            content=cached,
                            status_code=200,
                            media_type="application/json",
                            headers={"X-Redis-Cache": "HIT", "Cache-Control": cache_control},
                        )
                try:
                    response = await call_next(request)
                    if response.status_code != 200 or "application/json" not in response.headers.get("content-type", ""):
                        return response

                    body = b"".join([chunk async for chunk in response.body_iterator])
                    await self.cache.set(key, body, ttl=ttl)
                    headers = dict(response.headers)
                    headers.pop("content-length", None)
                    headers["X-Redis-Cache"] = "MISS"
                    headers["Cache-Control"] = cache_control
                    return Response(
                        content=body,
                        status_code=response.status_code,
                        headers=headers,
                        background=response.background,
                    )
                finally:
                    if release_lock is not None:
                        await release_lock(key, lock_token)

        response = await call_next(request)
        if (
            request.method in {"POST", "PUT", "PATCH", "DELETE"}
            and path.startswith("/api/management")
            and response.status_code < 400
        ):
            scopes = public_cache_prefixes_for_management_path(path)
            if scopes:
                await self.cache.invalidate_public_cache(scopes)
                await self.revalidate_public_pages(scopes)
        return response

    async def refresh_stale(self, path: str, query: str, key: str, ttl: int) -> None:
        try:
            async with self.coalesce_cache_miss(key):
                cached_entry = await self.cache.get_entry(key)
                if cached_entry is None or not cached_entry[1]:
                    return
                acquire_lock = getattr(self.cache, "acquire_fill_lock", None)
                release_lock = getattr(self.cache, "release_fill_lock", None)
                lock_token = await acquire_lock(key) if acquire_lock is not None else "local-only"
                if lock_token is None:
                    return
                try:
                    transport = httpx.ASGITransport(app=self.app)
                    async with httpx.AsyncClient(transport=transport, base_url="http://cache-refresh") as client:
                        response = await client.get(path, params=query, headers={"X-Cache-Refresh": "1"})
                    if response.status_code != 200 or "application/json" not in response.headers.get("content-type", ""):
                        return
                    await self.cache.set(key, response.content, ttl=ttl)
                finally:
                    if release_lock is not None:
                        await release_lock(key, lock_token)
        except Exception:
            logger.exception("Background refresh failed for %s", key)
