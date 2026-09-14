from pathlib import Path
from uuid import uuid4

from app.services.cos_storage import CosStorage


IMAGE_EXTENSIONS = {".gif", ".jpeg", ".jpg", ".png", ".webp"}
PDF_CONTENT_TYPES = {"application/pdf"}
GENERIC_CONTENT_TYPES = {"", "application/octet-stream"}


def _save_bytes(target: Path, content: bytes) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)


def _public_url(public_root: str, upload_id: str, filename: str) -> str:
    return f"{public_root.rstrip('/')}/{upload_id}/{filename}"


def parse_product_detail_upload(
    *,
    filename: str,
    content_type: str,
    content: bytes,
    upload_root: Path,
    public_root: str,
    public_storage: CosStorage | None = None,
) -> list[dict[str, object]]:
    safe_name = Path(filename or "upload.bin").name
    extension = Path(safe_name).suffix.lower()
    upload_id = uuid4().hex
    upload_dir = upload_root / upload_id

    if extension in IMAGE_EXTENSIONS and (content_type.startswith("image/") or content_type in GENERIC_CONTENT_TYPES):
        stored_name = f"image{extension}"
        url = _public_url(public_root, upload_id, stored_name)
        if public_storage is None:
            _save_bytes(upload_dir / stored_name, content)
        else:
            url = public_storage.save_public_bytes(
                key=url,
                content=content,
                content_type=content_type or "application/octet-stream",
                fallback_path=upload_dir / stored_name,
            )
        return [{
            "type": "image",
            "url": url,
            "name": safe_name,
            "alt": Path(safe_name).stem,
        }]

    if extension == ".pdf" and content_type in PDF_CONTENT_TYPES | GENERIC_CONTENT_TYPES:
        stored_name = "document.pdf"
        url = _public_url(public_root, upload_id, stored_name)
        if public_storage is None:
            _save_bytes(upload_dir / stored_name, content)
        else:
            url = public_storage.save_public_bytes(
                key=url,
                content=content,
                content_type="application/pdf",
                fallback_path=upload_dir / stored_name,
            )
        return [{
            "type": "pdf",
            "url": url,
            "name": safe_name,
        }]

    raise ValueError("Only PDF, PNG, JPG, WEBP, and GIF files are supported")
