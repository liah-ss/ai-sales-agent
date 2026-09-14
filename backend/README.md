# ExampleCorp Backend

FastAPI backend for the ExampleCorp B2B website.

## Redis response cache

Public catalog GET APIs can use Redis as a shared response cache. Redis is optional for direct local development and enabled automatically by `docker compose`.

```bash
export REDIS_URL=redis://127.0.0.1:6379/0
export REDIS_CACHE_TTL_SECONDS=120
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Cached responses include `X-Redis-Cache: MISS` on the first request and `X-Redis-Cache: HIT` on subsequent requests. Successful management writes clear the public response cache.

## Development

```bash
../.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/api/health
```
