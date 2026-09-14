import json
from typing import Protocol

import httpx

from app.core.config import Settings, get_settings


class TranslationProvider(Protocol):
    name: str
    model: str

    def translate(
        self,
        payload: dict[str, object],
        source_locale: str,
        target_locale: str,
    ) -> dict[str, object]: ...


class OpenAICompatibleTranslationProvider:
    name = "openai-compatible"

    def __init__(self, settings: Settings):
        self.api_key = settings.translation_api_key
        self.base_url = settings.translation_base_url.rstrip("/")
        self.model = settings.translation_model
        self.timeout = settings.translation_timeout_seconds

    def translate(
        self,
        payload: dict[str, object],
        source_locale: str,
        target_locale: str,
    ) -> dict[str, object]:
        if not self.api_key:
            raise RuntimeError("translation API key is not configured")
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Translate the supplied structured business content from "
                            f"{source_locale} to {target_locale}. Return one JSON object with "
                            "exactly the same keys and structure. Preserve HTML tags, URLs, "
                            "placeholders, product codes, model identifiers, standards, numbers, "
                            "measurements, currencies, and certification names."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(payload, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        translated = json.loads(content)
        if not isinstance(translated, dict):
            raise ValueError("translation provider returned a non-object payload")
        return translated


def get_translation_provider() -> TranslationProvider:
    settings = get_settings()
    if settings.translation_provider != "openai-compatible":
        raise RuntimeError(f"unsupported translation provider: {settings.translation_provider}")
    return OpenAICompatibleTranslationProvider(settings)
