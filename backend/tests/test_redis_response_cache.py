import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.redis_response_cache import RedisResponseCacheMiddleware
from app.services.redis_cache import (
    is_public_cache_path,
    public_cache_prefixes_for_management_path,
    public_cache_ttl,
    response_cache_key,
)


class FakeRedisCache:
    namespace = "test"
    default_ttl = 86400

    def __init__(self) -> None:
        self.values: dict[str, bytes] = {}
        self.clear_count = 0
        self.last_ttl: int | None = None
        self.stale_keys: set[str] = set()
        self.invalidated_prefixes: tuple[str, ...] = ()

    async def get(self, key: str) -> bytes | None:
        return self.values.get(key)

    async def get_entry(self, key: str) -> tuple[bytes, bool] | None:
        value = self.values.get(key)
        return (value, key in self.stale_keys) if value is not None else None

    async def set(self, key: str, value: bytes, ttl: int | None = None) -> None:
        self.values[key] = value
        self.stale_keys.discard(key)
        self.last_ttl = ttl

    async def clear_public_cache(self) -> int:
        count = len(self.values)
        self.values.clear()
        self.clear_count += 1
        return count

    async def invalidate_public_cache(self, public_prefixes: tuple[str, ...]) -> int:
        self.invalidated_prefixes = public_prefixes
        for key in self.values:
            if any(key.startswith(f"test:http:{prefix}") for prefix in public_prefixes):
                self.stale_keys.add(key)
        return len(self.stale_keys)


class RedisResponseCacheTest(unittest.TestCase):
    def test_public_cache_key_normalizes_query_order(self) -> None:
        first = response_cache_key("site", "/api/products", "page=1&page_size=24")
        second = response_cache_key("site", "/api/products", "page_size=24&page=1")
        self.assertEqual(first, second)
        tracked = response_cache_key("site", "/api/home", "utm_source=ads&gclid=123")
        self.assertEqual(tracked, response_cache_key("site", "/api/home", ""))
        self.assertTrue(is_public_cache_path("/api/products/p001"))
        self.assertFalse(is_public_cache_path("/api/management/products"))
        self.assertEqual(public_cache_ttl("/api/home", 86400), 900)
        self.assertEqual(public_cache_ttl("/api/products/p001", 86400), 900)

    def test_management_paths_map_to_selective_public_families(self) -> None:
        self.assertEqual(
            public_cache_prefixes_for_management_path("/api/management/catalog/news/7"),
            ("/api/news", "/api/home"),
        )
        self.assertEqual(
            public_cache_prefixes_for_management_path("/api/management/catalog/delivery-cases/2"),
            ("/api/delivery-cases", "/api/home"),
        )
        self.assertEqual(public_cache_prefixes_for_management_path("/api/management/inquiries/1"), ())

    def test_second_public_request_is_served_from_cache(self) -> None:
        cache = FakeRedisCache()
        app = FastAPI()
        app.add_middleware(RedisResponseCacheMiddleware, cache=cache)
        calls = 0

        @app.get("/api/products")
        def products():
            nonlocal calls
            calls += 1
            return {"calls": calls}

        client = TestClient(app)
        first = client.get("/api/products?page=1")
        second = client.get("/api/products?page=1")

        self.assertEqual(first.headers["X-Redis-Cache"], "MISS")
        self.assertEqual(second.headers["X-Redis-Cache"], "HIT")
        self.assertEqual(first.json(), second.json())
        self.assertEqual(calls, 1)
        self.assertEqual(cache.last_ttl, 900)
        self.assertIn("stale-while-revalidate", second.headers["Cache-Control"])

    def test_concurrent_cache_misses_are_coalesced(self) -> None:
        cache = FakeRedisCache()
        app = FastAPI()
        app.add_middleware(RedisResponseCacheMiddleware, cache=cache)
        calls = 0

        @app.get("/api/products")
        async def products():
            nonlocal calls
            calls += 1
            await asyncio.sleep(0.05)
            return {"calls": calls}

        async def request_concurrently():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await asyncio.gather(*(client.get("/api/products?page=1") for _ in range(8)))

        responses = asyncio.run(request_concurrently())

        self.assertEqual(calls, 1)
        self.assertEqual([response.status_code for response in responses], [200] * 8)
        self.assertEqual(sum(response.headers["X-Redis-Cache"] == "MISS" for response in responses), 1)
        self.assertEqual(sum(response.headers["X-Redis-Cache"] == "HIT" for response in responses), 7)
        self.assertEqual({response.json()["calls"] for response in responses}, {1})

    def test_stale_response_returns_immediately_and_refreshes_in_background(self) -> None:
        cache = FakeRedisCache()
        key = response_cache_key("test", "/api/news", "page=1")
        cache.values[key] = b'{"version":"old"}'
        cache.stale_keys.add(key)
        app = FastAPI()
        app.add_middleware(RedisResponseCacheMiddleware, cache=cache)
        calls = 0

        @app.get("/api/news")
        async def news():
            nonlocal calls
            calls += 1
            await asyncio.sleep(0.03)
            return {"version": "new"}

        async def request_and_wait():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                stale = await client.get("/api/news?page=1")
                await asyncio.sleep(0.08)
                fresh = await client.get("/api/news?page=1")
                return stale, fresh

        stale, fresh = asyncio.run(request_and_wait())

        self.assertEqual(stale.headers["X-Redis-Cache"], "STALE")
        self.assertEqual(stale.json(), {"version": "old"})
        self.assertEqual(fresh.headers["X-Redis-Cache"], "HIT")
        self.assertEqual(fresh.json(), {"version": "new"})
        self.assertEqual(calls, 1)

    def test_stale_refreshes_have_a_global_concurrency_limit(self) -> None:
        cache = FakeRedisCache()
        paths = [f"/api/products/p-{index}" for index in range(4)]
        for path in paths:
            key = response_cache_key("test", path, "")
            cache.values[key] = b'{"version":"old"}'
            cache.stale_keys.add(key)

        app = FastAPI()
        app.add_middleware(RedisResponseCacheMiddleware, cache=cache)
        active = 0
        calls = 0
        max_active = 0

        @app.get("/api/products/{slug}")
        async def product(slug: str):
            nonlocal active, calls, max_active
            active += 1
            calls += 1
            max_active = max(max_active, active)
            await asyncio.sleep(0.05)
            active -= 1
            return {"version": "new", "slug": slug}

        async def request_concurrently():
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                stale_responses = await asyncio.gather(*(client.get(path) for path in paths))
                await asyncio.sleep(0.08)

                remaining_stale_path = next(
                    path
                    for path in paths
                    if response_cache_key("test", path, "") in cache.stale_keys
                )
                retry = await client.get(remaining_stale_path)
                await asyncio.sleep(0.08)
                return stale_responses, retry, remaining_stale_path

        stale_responses, retry, retried_path = asyncio.run(request_concurrently())

        self.assertEqual([response.headers["X-Redis-Cache"] for response in stale_responses], ["STALE"] * 4)
        self.assertEqual(retry.headers["X-Redis-Cache"], "STALE")
        self.assertEqual(max_active, 1)
        self.assertEqual(calls, 2)
        self.assertNotIn(response_cache_key("test", retried_path, ""), cache.stale_keys)

    def test_management_write_only_soft_expires_affected_cache(self) -> None:
        cache = FakeRedisCache()
        cache.values["test:http:/api/products"] = b"{}"
        cache.values["test:http:/api/news"] = b"[]"
        app = FastAPI()
        app.add_middleware(RedisResponseCacheMiddleware, cache=cache)

        @app.put("/api/management/catalog/products/1")
        def update_product():
            return {"ok": True}

        response = TestClient(app).put("/api/management/catalog/products/1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(cache.clear_count, 0)
        self.assertEqual(cache.invalidated_prefixes, ("/api/products", "/api/home"))
        self.assertIn("test:http:/api/products", cache.stale_keys)
        self.assertNotIn("test:http:/api/news", cache.stale_keys)

    def test_management_write_revalidates_nuxt_page_cache(self) -> None:
        cache = FakeRedisCache()
        app = FastAPI()
        app.add_middleware(
            RedisResponseCacheMiddleware,
            cache=cache,
            revalidate_url="http://frontend/api/internal/revalidate",
            revalidate_secret="test-secret",
        )

        @app.put("/api/management/catalog/products/1")
        def update_product():
            return {"ok": True}

        client = MagicMock()
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=None)
        client.post = AsyncMock()
        with patch("app.middleware.redis_response_cache.httpx.AsyncClient", return_value=client):
            response = TestClient(app).put("/api/management/catalog/products/1")

        self.assertEqual(response.status_code, 200)
        client.post.assert_awaited_once_with(
            "http://frontend/api/internal/revalidate",
            headers={"X-Revalidate-Secret": "test-secret"},
            json={"scopes": ["/api/products", "/api/home"]},
        )


if __name__ == "__main__":
    unittest.main()
