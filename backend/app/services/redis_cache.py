from __future__ import annotations

import asyncio
import logging
import secrets
import struct
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import parse_qsl, urlencode

try:
    from redis.asyncio import Redis
except ModuleNotFoundError:  # Local development may run without the optional service.
    Redis = None  # type: ignore[assignment,misc]


logger = logging.getLogger(__name__)

PUBLIC_CACHE_PREFIXES = (
    "/api/categories",
    "/api/products",
    "/api/solutions",
    "/api/news",
    "/api/delivery-cases",
    "/api/home",
    "/api/site-settings",
    "/api/website-config",
)

PUBLIC_CACHE_TTLS = {
    "/api/home": 900,
    "/api/categories": 3600,
    "/api/site-settings": 3600,
    "/api/website-config": 3600,
    "/api/products": 900,
    "/api/solutions": 1800,
    "/api/news": 900,
    "/api/delivery-cases": 1800,
}

STALE_CACHE_SECONDS = 86400
_CACHE_ENVELOPE = b"TG1"
IGNORED_CACHE_QUERY_KEYS = {"fbclid", "gclid", "msclkid", "_", "cacheBust"}
FAMILY_VERSION_LOCAL_TTL_SECONDS = 1.0
LOCK_TTL_MILLISECONDS = 10_000
_RELEASE_LOCK_SCRIPT = """
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
"""


def is_ignored_cache_query_key(key: str) -> bool:
    return key in IGNORED_CACHE_QUERY_KEYS or key.lower().startswith("utm_")


def is_public_cache_path(path: str) -> bool:
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in PUBLIC_CACHE_PREFIXES)


def public_cache_family(path: str) -> str:
    matches = (prefix for prefix in PUBLIC_CACHE_PREFIXES if path == prefix or path.startswith(f"{prefix}/"))
    prefix = max(matches, key=len, default="/api/misc")
    return prefix.removeprefix("/api/")


def response_cache_key(namespace: str, path: str, query: str, *, version: int | None = None) -> str:
    normalized_query = urlencode(sorted(
        (key, value)
        for key, value in parse_qsl(query, keep_blank_values=True)
        if not is_ignored_cache_query_key(key)
    ))
    suffix = f"?{normalized_query}" if normalized_query else ""
    version_segment = f":{public_cache_family(path)}:v{version}" if version is not None else ""
    return f"{namespace}:http{version_segment}:{path}{suffix}"


def public_cache_ttl(path: str, default_ttl: int) -> int:
    matches = (prefix for prefix in PUBLIC_CACHE_TTLS if path == prefix or path.startswith(f"{prefix}/"))
    prefix = max(matches, key=len, default=None)
    return PUBLIC_CACHE_TTLS[prefix] if prefix else default_ttl


def public_cache_prefixes_for_management_path(path: str) -> tuple[str, ...]:
    """Return only the public API families affected by a management write."""
    catalog_prefix = "/api/management/catalog/"
    if path.startswith(catalog_prefix):
        module = path[len(catalog_prefix):].split("/", 1)[0]
        return {
            "categories": ("/api/categories", "/api/products", "/api/home"),
            "products": ("/api/products", "/api/home"),
            "solutions": ("/api/solutions", "/api/home"),
            "news": ("/api/news", "/api/home"),
            "delivery-cases": ("/api/delivery-cases", "/api/home"),
        }.get(module, ())

    translations_prefix = "/api/management/translations/"
    if path.startswith(translations_prefix):
        module = path[len(translations_prefix):].split("/", 1)[0]
        return {
            "categories": ("/api/categories", "/api/products", "/api/home"),
            "products": ("/api/products", "/api/home"),
            "solutions": ("/api/solutions", "/api/home"),
            "news": ("/api/news", "/api/home"),
            "delivery-cases": ("/api/delivery-cases", "/api/home"),
        }.get(module, ())

    if path == "/api/management/site-settings":
        return ("/api/site-settings", "/api/home")
    if path == "/api/management/website-config":
        return ("/api/website-config", "/api/home")
    return ()


def _encode_cache_entry(value: bytes, fresh_until: int) -> bytes:
    return _CACHE_ENVELOPE + struct.pack(">Q", max(0, fresh_until)) + value


def _decode_cache_entry(value: bytes) -> tuple[bytes, bool]:
    if not value.startswith(_CACHE_ENVELOPE) or len(value) < 11:
        # Entries written by an older release remain usable until their Redis TTL.
        return value, False
    fresh_until = struct.unpack(">Q", value[3:11])[0]
    return value[11:], fresh_until <= int(time.time())


@dataclass
class RedisCache:
    url: str
    default_ttl: int = 120
    namespace: str = "examplecorp"
    retry_interval_seconds: int = 30
    local_ttl_seconds: int = 5
    local_max_entries: int = 256
    _client: Any = field(default=None, init=False, repr=False)
    _retry_after: float = field(default=0.0, init=False, repr=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False, repr=False)
    _local: OrderedDict[str, tuple[float, bytes]] = field(default_factory=OrderedDict, init=False, repr=False)
    _family_versions: dict[str, tuple[float, int]] = field(default_factory=dict, init=False, repr=False)

    @property
    def enabled(self) -> bool:
        return bool(self.url) and Redis is not None

    async def _get_client(self):
        if self._client is not None:
            return self._client
        if not self.enabled or time.monotonic() < self._retry_after:
            return None

        async with self._lock:
            if self._client is not None:
                return self._client
            if time.monotonic() < self._retry_after:
                return None
            client = Redis.from_url(
                self.url,
                decode_responses=False,
                socket_connect_timeout=0.5,
                socket_timeout=1.0,
            )
            try:
                await client.ping()
            except Exception as exc:  # Redis is an optimization, never an API dependency.
                self._retry_after = time.monotonic() + self.retry_interval_seconds
                await client.aclose()
                logger.warning("Redis unavailable; public cache bypassed: %s", exc)
                return None
            self._client = client
            logger.info("Redis public response cache connected")
            return client

    async def get(self, key: str) -> bytes | None:
        entry = await self.get_entry(key)
        return entry[0] if entry is not None else None

    async def get_entry(self, key: str) -> tuple[bytes, bool] | None:
        local = self._local.get(key)
        if local is not None:
            expires_at, value = local
            if expires_at > time.monotonic():
                self._local.move_to_end(key)
                return _decode_cache_entry(value)
            self._local.pop(key, None)

        client = await self._get_client()
        if client is None:
            return None
        try:
            value = await client.get(key)
            if value is None:
                return None
            payload = bytes(value)
            self._remember_local(key, payload)
            return _decode_cache_entry(payload)
        except Exception as exc:
            await self._mark_unavailable(exc)
            return None

    async def set(self, key: str, value: bytes, ttl: int | None = None) -> None:
        resolved_ttl = max(1, ttl or self.default_ttl)
        payload = _encode_cache_entry(value, int(time.time()) + resolved_ttl)
        client = await self._get_client()
        if client is None:
            return
        try:
            await client.set(key, payload, ex=resolved_ttl + STALE_CACHE_SECONDS)
            self._remember_local(key, payload, resolved_ttl)
        except Exception as exc:
            await self._mark_unavailable(exc)

    async def response_key(self, path: str, query: str) -> str:
        family = public_cache_family(path)
        version = await self.family_version(family)
        return response_cache_key(self.namespace, path, query, version=version)

    async def family_version(self, family: str) -> int:
        cached = self._family_versions.get(family)
        if cached is not None and cached[0] > time.monotonic():
            return cached[1]
        client = await self._get_client()
        if client is None:
            return 1
        try:
            raw = await client.get(f"{self.namespace}:cache-version:{family}")
            version = int(raw) if raw is not None else 0
            self._family_versions[family] = (
                time.monotonic() + FAMILY_VERSION_LOCAL_TTL_SECONDS,
                version,
            )
            return version
        except Exception as exc:
            await self._mark_unavailable(exc)
            return 1

    async def clear_public_cache(self) -> int:
        return await self.invalidate_public_cache(PUBLIC_CACHE_PREFIXES)

    async def invalidate_public_cache(self, public_prefixes: tuple[str, ...]) -> int:
        """Invalidate cache families in O(number of families), without scanning response keys."""
        if not public_prefixes:
            return 0
        families = tuple(dict.fromkeys(public_cache_family(prefix) for prefix in public_prefixes))
        self._local.clear()
        for family in families:
            self._family_versions.pop(family, None)

        client = await self._get_client()
        if client is None:
            return 0
        try:
            pipeline = client.pipeline(transaction=False)
            for family in families:
                pipeline.incr(f"{self.namespace}:cache-version:{family}")
            versions = await pipeline.execute()
            now = time.monotonic()
            for family, version in zip(families, versions, strict=True):
                self._family_versions[family] = (
                    now + FAMILY_VERSION_LOCAL_TTL_SECONDS,
                    int(version),
                )
            return len(families)
        except Exception as exc:
            await self._mark_unavailable(exc)
            return 0

    async def acquire_fill_lock(self, key: str) -> str | None:
        client = await self._get_client()
        if client is None:
            return "local-only"
        token = secrets.token_urlsafe(18)
        try:
            acquired = await client.set(
                f"{key}:fill-lock",
                token,
                nx=True,
                px=LOCK_TTL_MILLISECONDS,
            )
            return token if acquired else None
        except Exception as exc:
            await self._mark_unavailable(exc)
            return "local-only"

    async def release_fill_lock(self, key: str, token: str | None) -> None:
        if not token or token == "local-only":
            return
        client = await self._get_client()
        if client is None:
            return
        try:
            await client.eval(_RELEASE_LOCK_SCRIPT, 1, f"{key}:fill-lock", token)
        except Exception as exc:
            await self._mark_unavailable(exc)

    async def wait_for_fill(self, key: str, timeout_seconds: float = 1.5) -> bytes | None:
        deadline = time.monotonic() + timeout_seconds
        delay = 0.025
        while time.monotonic() < deadline:
            await asyncio.sleep(delay)
            cached = await self.get(key)
            if cached is not None:
                return cached
            delay = min(delay * 1.5, 0.1)
        return None

    def _remember_local(self, key: str, value: bytes, ttl: int | None = None) -> None:
        local_ttl = min(max(1, ttl or self.local_ttl_seconds), self.local_ttl_seconds)
        self._local[key] = (time.monotonic() + local_ttl, value)
        self._local.move_to_end(key)
        while len(self._local) > self.local_max_entries:
            self._local.popitem(last=False)

    async def _mark_unavailable(self, exc: Exception) -> None:
        client = self._client
        self._client = None
        self._retry_after = time.monotonic() + self.retry_interval_seconds
        if client is not None:
            await client.aclose()
        logger.warning("Redis operation failed; cache bypassed temporarily: %s", exc)

    async def close(self) -> None:
        client = self._client
        self._client = None
        if client is not None:
            await client.aclose()
