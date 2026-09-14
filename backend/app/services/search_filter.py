import json
import re
import unicodedata

from sqlalchemy import String, cast, or_
from sqlalchemy.sql.elements import ColumnElement


def fuzzy_text_filter(query: str, *columns: ColumnElement[object]) -> ColumnElement[bool]:
    terms = [term for term in normalize_search_text(query).split() if term]
    return or_(*(
        cast(column, String).ilike(f"%{candidate}%")
        for term in terms
        for candidate in {term, json.dumps(term, ensure_ascii=True)[1:-1]}
        for column in columns
    ))


def normalize_search_text(value: str) -> str:
    return unicodedata.normalize("NFKC", value).casefold().strip()


def compact_search_text(value: str) -> str:
    return re.sub(r"[^\w]+", "", normalize_search_text(value), flags=re.UNICODE)
