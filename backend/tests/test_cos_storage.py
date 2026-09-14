import tempfile
from pathlib import Path

from app.core.config import Settings
from app.services.cos_storage import CosStorage


class FakeCosClient:
    def __init__(self) -> None:
        self.objects: list[dict] = []
        self.acls: list[dict] = []

    def put_object(self, **kwargs) -> None:
        self.objects.append(kwargs)

    def put_object_acl(self, **kwargs) -> None:
        self.acls.append(kwargs)


def test_enabled_storage_uploads_and_returns_stable_relative_url() -> None:
    client = FakeCosClient()
    settings = Settings(
        cos_upload_enabled=True,
        cos_bucket="example-123",
        cos_region="ap-chengdu",
        cos_secret_id="secret-id",
        cos_secret_key="secret-key",
        cos_public_base_url="https://assets.example.com",
    )
    storage = CosStorage(settings, client=client)

    with tempfile.TemporaryDirectory() as directory:
        fallback = Path(directory) / "image.png"
        url = storage.save_public_bytes(
            key="/uploads/images/image.png",
            content=b"image-content",
            content_type="image/png",
            fallback_path=fallback,
        )

        assert url == "/uploads/images/image.png"
        assert not fallback.exists()
        assert client.objects[0]["Key"] == "uploads/images/image.png"
        assert client.acls[0]["ACL"] == "public-read"
        assert storage.public_url("uploads/中文 image.png").endswith("uploads/%E4%B8%AD%E6%96%87%20image.png")


def test_disabled_storage_writes_local_fallback() -> None:
    storage = CosStorage(Settings(cos_upload_enabled=False))
    with tempfile.TemporaryDirectory() as directory:
        fallback = Path(directory) / "nested" / "image.png"
        url = storage.save_public_bytes(
            key="uploads/images/image.png",
            content=b"image-content",
            content_type="image/png",
            fallback_path=fallback,
        )

        assert url == "/uploads/images/image.png"
        assert fallback.read_bytes() == b"image-content"
