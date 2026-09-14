import re
import unicodedata


MAX_PUBLIC_SLUG_LENGTH = 180
PUBLIC_SLUG_SUFFIX = ".html"


def slugify_product_name(value: str, *, product_id: int | None = None) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", normalized).strip("-")
    return slug[:MAX_PUBLIC_SLUG_LENGTH].rstrip("-") or "product"


def product_public_slug(product: object) -> str:
    translations = getattr(product, "translations", None) or {}
    english = translations.get("en") if isinstance(translations, dict) else None
    english_name = english.get("name") if isinstance(english, dict) else None
    name = str(english_name or getattr(product, "name", "")).strip()
    raw_product_id = getattr(product, "id", None)
    product_id = int(raw_product_id) if raw_product_id is not None else None
    base = slugify_product_name(name, product_id=product_id)
    trimmed = base[: MAX_PUBLIC_SLUG_LENGTH - len(PUBLIC_SLUG_SUFFIX)].rstrip("-")
    return f"{trimmed}{PUBLIC_SLUG_SUFFIX}"


def product_public_slug_key(product: object) -> str:
    return product_public_slug(product).casefold()
