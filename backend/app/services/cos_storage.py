from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

from qcloud_cos import CosConfig, CosS3Client

from app.core.config import Settings, get_settings


class CosStorage:
    def __init__(self, settings: Settings, client: CosS3Client | None = None) -> None:
        self.settings = settings
        self.enabled = settings.cos_upload_enabled
        self._client = client
        if self.enabled:
            missing = [
                name
                for name, value in (
                    ("COS_BUCKET", settings.cos_bucket),
                    ("COS_REGION", settings.cos_region),
                    ("COS_SECRET_ID", settings.cos_secret_id),
                    ("COS_SECRET_KEY", settings.cos_secret_key),
                )
                if not value
            ]
            if missing:
                raise RuntimeError(f"COS uploads are enabled but required settings are missing: {', '.join(missing)}")

    @property
    def client(self) -> CosS3Client:
        if self._client is None:
            config = CosConfig(
                Region=self.settings.cos_region,
                SecretId=self.settings.cos_secret_id,
                SecretKey=self.settings.cos_secret_key,
                Scheme="https",
            )
            self._client = CosS3Client(config)
        return self._client

    def public_url(self, key: str) -> str:
        base_url = self.settings.cos_public_base_url.rstrip("/") or (
            f"https://{self.settings.cos_bucket}.cos.{self.settings.cos_region}.myqcloud.com"
        )
        return f"{base_url}/{quote(key.lstrip('/'), safe='/')}"

    def save_public_bytes(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
        fallback_path: Path,
    ) -> str:
        normalized_key = key.lstrip("/")
        if self.enabled:
            self.client.put_object(
                Bucket=self.settings.cos_bucket,
                Key=normalized_key,
                Body=content,
                ContentType=content_type,
            )
            self.client.put_object_acl(
                Bucket=self.settings.cos_bucket,
                Key=normalized_key,
                ACL="public-read",
            )
        else:
            fallback_path.parent.mkdir(parents=True, exist_ok=True)
            fallback_path.write_bytes(content)
        return f"/{normalized_key}"

    def publish_public_file(self, *, key: str, path: Path, content_type: str) -> str:
        normalized_key = key.lstrip("/")
        if self.enabled:
            self.client.put_object_from_local_file(
                Bucket=self.settings.cos_bucket,
                LocalFilePath=str(path),
                Key=normalized_key,
                ContentType=content_type,
            )
            self.client.put_object_acl(
                Bucket=self.settings.cos_bucket,
                Key=normalized_key,
                ACL="public-read",
            )
        return f"/{normalized_key}"

    def read_bytes(self, *, key: str, fallback_path: Path) -> bytes:
        normalized_key = key.lstrip("/")
        if not self.enabled:
            return fallback_path.read_bytes()

        response = self.client.get_object(
            Bucket=self.settings.cos_bucket,
            Key=normalized_key,
        )
        raw_stream = response["Body"].get_raw_stream()
        try:
            return raw_stream.read()
        finally:
            raw_stream.close()


@lru_cache
def get_cos_storage() -> CosStorage:
    return CosStorage(get_settings())
