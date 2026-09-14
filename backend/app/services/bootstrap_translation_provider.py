import json
import re
import ssl
import subprocess
import time
from collections.abc import Callable
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import certifi
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.services.translation_service import (
    MODULE_CONFIG,
    TranslationGenerationError,
    choose_source,
    generate_english,
    translation_status,
)
from app.services.content_sanitizer import sanitize_rich_html
from app.services.localized_content import source_fingerprint


GOOGLE_TRANSLATE_URL = "https://translate.google.com/translate_a/single"
GOOGLE_TRANSLATE_FALLBACK_URL = "https://translate.googleapis.com/translate_a/single"
SPLIT_MARKER = "---EXAMPLECORP-SPLIT-7F3A---"
CJK_PATTERN = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
TRANSIENT_HTTP_STATUSES = {405, 408, 425, 429, 500, 502, 503, 504}

TranslationRequest = Callable[[str, str, str], str]
ProgressCallback = Callable[[str, int, int, str], None]


def contains_chinese(value: str) -> bool:
    return bool(CJK_PATTERN.search(value))


def google_translate_request(text: str, source_locale: str, target_locale: str) -> str:
    data = urlencode(
        {
            "client": "gtx",
            "sl": source_locale,
            "tl": target_locale,
            "dt": "t",
            "q": text,
        }
    ).encode("utf-8")
    request = Request(
        GOOGLE_TRANSLATE_URL,
        data=data,
        headers={"User-Agent": "Mozilla/5.0"},
        method="POST",
    )
    context = ssl.create_default_context(cafile=certifi.where())
    for attempt in range(5):
        try:
            with urlopen(request, timeout=60, context=context) as response:  # noqa: S310 - fixed translation endpoint
                payload = json.load(response)
            break
        except HTTPError as exc:
            if exc.code == 400:
                fallback_query = urlencode({
                    "client": "gtx",
                    "sl": source_locale,
                    "tl": target_locale,
                    "dt": "t",
                    "q": text,
                })
                result = subprocess.run(
                    ["curl", "--fail", "--silent", "--show-error", f"{GOOGLE_TRANSLATE_FALLBACK_URL}?{fallback_query}"],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                payload = json.loads(result.stdout)
                break
            if exc.code not in TRANSIENT_HTTP_STATUSES or attempt == 4:
                raise
            time.sleep(float(2**attempt))
    return "".join(segment[0] for segment in payload[0] if segment and segment[0])


def collect_chinese_strings(value: Any, result: list[str], seen: set[str]) -> None:
    if isinstance(value, str):
        if contains_chinese(value) and value not in seen:
            seen.add(value)
            result.append(value)
        return
    if isinstance(value, list):
        for item in value:
            collect_chinese_strings(item, result, seen)
        return
    if isinstance(value, dict):
        for item in value.values():
            collect_chinese_strings(item, result, seen)


def chunk_strings(values: list[str], max_chars: int) -> list[list[str]]:
    chunks: list[list[str]] = []
    current: list[str] = []
    current_size = 0
    marker_size = len(SPLIT_MARKER) + 2
    for value in values:
        added_size = len(value) + (marker_size if current else 0)
        if current and current_size + added_size > max_chars:
            chunks.append(current)
            current = []
            current_size = 0
        current.append(value)
        current_size += len(value) + (marker_size if len(current) > 1 else 0)
    if current:
        chunks.append(current)
    return chunks


def replace_strings(value: Any, translations: dict[str, str]) -> Any:
    if isinstance(value, str):
        return translations.get(value, value)
    if isinstance(value, list):
        return [replace_strings(item, translations) for item in value]
    if isinstance(value, dict):
        return {key: replace_strings(item, translations) for key, item in value.items()}
    return value


class BootstrapTranslationProvider:
    name = "bootstrap-local"
    model = "google-translate-bootstrap-v1"

    def __init__(
        self,
        request: TranslationRequest = google_translate_request,
        max_chars: int = 3500,
        request_interval: float = 1.0,
    ) -> None:
        self.request = request
        self.max_chars = max_chars
        self.request_interval = request_interval
        self._cache: dict[tuple[str, str, str], str] = {}
        self._last_request_at: float | None = None

    def _request(self, text: str, source_locale: str, target_locale: str) -> str:
        if self._last_request_at is not None and self.request_interval > 0:
            elapsed = time.monotonic() - self._last_request_at
            if elapsed < self.request_interval:
                time.sleep(self.request_interval - elapsed)
        try:
            return self.request(text, source_locale, target_locale)
        finally:
            self._last_request_at = time.monotonic()

    def _translate_values(
        self,
        values: list[str],
        source_locale: str,
        target_locale: str,
    ) -> None:
        missing = [
            value
            for value in values
            if (source_locale, target_locale, value) not in self._cache
        ]
        for chunk in chunk_strings(missing, self.max_chars):
            joined = f"\n{SPLIT_MARKER}\n".join(chunk)
            translated = self._request(joined, source_locale, target_locale)
            parts = translated.split(SPLIT_MARKER)
            if len(parts) != len(chunk):
                raise ValueError(
                    f"translation response split mismatch: expected {len(chunk)}, got {len(parts)}"
                )
            self._cache.update(
                ((source_locale, target_locale, source), target.strip())
                for source, target in zip(chunk, parts, strict=True)
            )

    def prime(
        self,
        payloads: list[tuple[dict[str, object], str]],
        target_locale: str = "en",
    ) -> None:
        values_by_locale: dict[str, list[str]] = {}
        seen_by_locale: dict[str, set[str]] = {}
        for payload, source_locale in payloads:
            values = values_by_locale.setdefault(source_locale, [])
            seen = seen_by_locale.setdefault(source_locale, set())
            collect_chinese_strings(payload, values, seen)
        for source_locale, values in values_by_locale.items():
            self._translate_values(values, source_locale, target_locale)

    def translate(
        self,
        payload: dict[str, object],
        source_locale: str,
        target_locale: str,
    ) -> dict[str, object]:
        values: list[str] = []
        collect_chinese_strings(payload, values, set())
        self._translate_values(values, source_locale, target_locale)
        translations = {
            value: self._cache[(source_locale, target_locale, value)]
            for value in values
        }
        return replace_strings(payload, translations)


def bootstrap_all_english(
    db: Session,
    provider: BootstrapTranslationProvider,
    force: bool = False,
    on_progress: ProgressCallback | None = None,
    modules: list[str] | None = None,
    target_locale: str = "en",
    fields: tuple[str, ...] | None = None,
    product_batch_number: int | None = None,
) -> dict[str, dict[str, int]]:
    if target_locale not in {"en", "id"}:
        raise ValueError(f"unsupported target locale: {target_locale}")
    selected_modules = modules or list(MODULE_CONFIG)

    def load_records(module: str) -> list[object]:
        config = MODULE_CONFIG[module]
        query = select(config["model"]).order_by(config["model"].id)
        if module == "products" and product_batch_number is not None:
            query = query.where(config["model"].batch_number == product_batch_number)
        return list(db.scalars(query))

    pending_sources: list[tuple[dict[str, object], str]] = []
    for module in selected_modules:
        records = load_records(module)
        for record in records:
            source_locale, source = choose_source(record, module)
            if fields:
                source = {field: source.get(field) for field in fields if field in source}
            current = translation_status(record, module).status == "current" if target_locale == "en" else _target_translation_current(record, source, target_locale)
            if current and not force:
                continue
            pending_sources.append((source, source_locale))
    provider.prime(pending_sources, target_locale=target_locale)

    report: dict[str, dict[str, int]] = {}
    for module in selected_modules:
        stats = {"current": 0, "failed": 0, "skipped": 0}
        records = load_records(module)
        total = len(records)
        for index, record in enumerate(records, start=1):
            source_locale, source = choose_source(record, module)
            if fields:
                source = {field: source.get(field) for field in fields if field in source}
            current = translation_status(record, module).status == "current" if target_locale == "en" else _target_translation_current(record, source, target_locale)
            if current and not force:
                stats["skipped"] += 1
                if on_progress:
                    on_progress(module, index, total, "skipped")
                continue
            try:
                if target_locale == "en":
                    generate_english(db, module, record.id, provider, force=force)
                else:
                    translated = provider.translate(source, source_locale, target_locale)
                    translations = deepcopy(getattr(record, "translations", {}) or {})
                    translations[target_locale] = _with_manual_translation_metadata(
                        translated,
                        source_locale,
                        source,
                        provider,
                    )
                    setattr(record, "translations", translations)
                    db.add(record)
                    db.flush()
                db.commit()
                stats["current"] += 1
                if on_progress:
                    on_progress(module, index, total, "current")
            except TranslationGenerationError:
                db.commit()
                stats["failed"] += 1
                if on_progress:
                    on_progress(module, index, total, "failed")
        report[module] = stats
    return report


def _target_translation_current(record: object, source: dict[str, object], target_locale: str) -> bool:
    payload = dict((getattr(record, "translations", {}) or {}).get(target_locale, {}))
    metadata = dict(payload.get("_meta") or {})
    return (
        metadata.get("status") == "current"
        and metadata.get("source_fingerprint") == source_fingerprint(source)
    )


def _with_manual_translation_metadata(
    payload: dict[str, object],
    source_locale: str,
    source: dict[str, object],
    provider: BootstrapTranslationProvider,
) -> dict[str, object]:
    normalized = dict(payload)
    for field in ("content", "description", "detailed_description", "project_overview", "indonesia_fit", "professional_configuration", "project_results"):
        if isinstance(normalized.get(field), str):
            normalized[field] = sanitize_rich_html(normalized[field])
    normalized["_meta"] = {
        "status": "current",
        "source_locale": source_locale,
        "source_fingerprint": source_fingerprint(source),
        "generated_at": datetime.now(UTC).isoformat(),
        "provider": provider.name,
        "model": provider.model,
        "last_error": None,
    }
    return normalized
