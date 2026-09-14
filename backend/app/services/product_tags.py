from collections.abc import Iterable
from typing import Any


def normalize_tag_more(values: Any) -> list[str]:
    if isinstance(values, str):
        candidates: Iterable[Any] = [values]
    elif isinstance(values, Iterable) and not isinstance(values, (dict, bytes)):
        candidates = values
    else:
        candidates = []

    result: list[str] = []
    seen: set[str] = set()
    for value in candidates:
        normalized = " ".join(str(value).split()) if value is not None else ""
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def merge_tag_more(*groups: Any) -> list[str]:
    return normalize_tag_more(
        value
        for group in groups
        for value in normalize_tag_more(group)
    )
